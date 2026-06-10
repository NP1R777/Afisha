import re
from datetime import datetime, time, timedelta
from typing import Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.settings import AppSettings
from database.models import (
    CityEnum,
    EventGroupsEvent,
    Events,
    GroupsEvent,
    InfoOrganization,
    News,
    ParsedEvent,
    ParsedProcessStatus,
    ParsedTargetType,
    TimesEvent,
)
from src.parser.schemas import (
    ParseCategoryBackfillRequest,
    ParseCategoryBackfillResponse,
    ParseDistributeRequest,
    ParseDistributeResponse,
    ParseLaunchRequest,
    ParseLaunchResponse,
    ParseRunStats,
    ParseSourceInfo,
    ParsedEventListResponse,
    ParsedEventOut,
)
from src.parser.sources import (
    SOURCE_CONFIGS,
    ParserRuntimeConfig,
    parse_source,
    resolve_source_keys,
)


EVENT_TICKET_PATTERN = re.compile(
    r"билет|билеты|купить|касс[аы]|пушкинск(ая|ой)\s+карт",
    flags=re.IGNORECASE,
)
EVENT_CORE_PATTERN = re.compile(
    r"концерт|спектак|мероприят|мастер-?класс|выставк|фестивал|приглашаем|состоитс[яь]|пройд[её]т",
    flags=re.IGNORECASE,
)
NEWS_PATTERN = re.compile(
    r"состоял(?:ось|ся|ись)|прош[её]л|прошла|итог|подвели|завершил(?:ось|ся)|"
    r"поздравля|с\s+прискорбием|соболезн|отчет|отч[её]т",
    flags=re.IGNORECASE,
)
DATE_TIME_PATTERN = re.compile(r"\b(\d{1,2}\.\d{1,2}\.\d{4})(?:[,\s]+(\d{1,2}:\d{2}))?\b")
THEATER_PATTERN = re.compile(r"театр|спектак|драма|постановк|сцена|труппа", flags=re.IGNORECASE)
CINEMA_PATTERN = re.compile(r"кино|фильм|сеанс|кинопоказ|кинозал|мультфильм", flags=re.IGNORECASE)
SPORT_PATTERN = re.compile(
    r"спорт|матч|турнир|соревн|чемпионат|кубок|хоккей|футбол|волейбол|баскетбол",
    flags=re.IGNORECASE,
)


async def run_parse_and_store(
    db_connect: AsyncSession,
    request: ParseLaunchRequest,
    settings: AppSettings,
) -> ParseLaunchResponse:
    source_keys = resolve_source_keys(
        source_keys=request.source_keys,
        include_reserve=request.include_reserve,
    )
    stats: list[ParseRunStats] = []

    total_fetched = 0
    total_inserted = 0
    total_duplicates = 0
    total_errors = 0
    runtime_config = ParserRuntimeConfig(
        vmuzey_proxy=settings.vmuzey_proxy,
        vmuzey_cookies=settings.vmuzey_cookies,
        vmuzey_user_agent=settings.vmuzey_user_agent,
    )

    for source_key in source_keys:
        source = SOURCE_CONFIGS[source_key]
        fetched = 0
        inserted = 0
        duplicates = 0
        errors = 0

        try:
            parsed_items = parse_source(
                source,
                max_events=request.max_events_per_source,
                runtime_config=runtime_config,
            )
            fetched = len(parsed_items)
        except Exception:
            parsed_items = []
            errors += 1

        for parsed_item in parsed_items:
            duplicate_query = await db_connect.execute(
                select(ParsedEvent.id).where(
                    ParsedEvent.name == parsed_item.name,
                    ParsedEvent.date_event == parsed_item.date_event,
                )
            )
            if duplicate_query.scalar_one_or_none():
                duplicates += 1
                continue

            db_connect.add(
                ParsedEvent(
                    source_key=parsed_item.source_key,
                    source_name=parsed_item.source_name,
                    name=parsed_item.name,
                    description=parsed_item.description,
                    date_event=parsed_item.date_event,
                    duration=parsed_item.duration,
                    city=parsed_item.city,
                    price=parsed_item.price,
                    address=parsed_item.address,
                    organization=parsed_item.organization,
                    age_limit=parsed_item.age_limit,
                    external_url=parsed_item.external_url,
                    pictures_main=parsed_item.pictures_main,
                    target_type=parsed_item.target_type or "unknown",
                    process_status=parsed_item.process_status or "new",
                    processed_at=parsed_item.processed_at,
                    error_text=parsed_item.error_text,
                )
            )
            inserted += 1

        total_fetched += fetched
        total_inserted += inserted
        total_duplicates += duplicates
        total_errors += errors

        stats.append(
            ParseRunStats(
                source_key=source.key,
                source_name=source.name,
                fetched=fetched,
                inserted=inserted,
                duplicates=duplicates,
                errors=errors,
            )
        )

    return ParseLaunchResponse(
        requested_sources=source_keys,
        total_fetched=total_fetched,
        total_inserted=total_inserted,
        total_duplicates=total_duplicates,
        total_errors=total_errors,
        stats=stats,
    )


async def distribute_parsed_events(
    db_connect: AsyncSession,
    request: ParseDistributeRequest,
) -> ParseDistributeResponse:
    cleaned_deleted = await _cleanup_soft_deleted_parsed(db_connect)
    group_lookup = await _load_group_lookup(db_connect)

    query = (
        select(ParsedEvent)
        .where(
            ParsedEvent.process_status == ParsedProcessStatus.new,
            ParsedEvent.deleted_at.is_(None),
        )
        .order_by(ParsedEvent.created_at.asc(), ParsedEvent.id.asc())
        .limit(request.limit)
    )
    if request.source_key:
        query = query.where(ParsedEvent.source_key == request.source_key)

    rows = (await db_connect.execute(query)).scalars().all()
    now_utc = datetime.utcnow()

    processed_events = 0
    processed_news = 0
    unknown = 0
    duplicates_deleted = 0
    errors = 0

    for item in rows:
        try:
            target_type = _classify_target_type(item)

            if target_type == ParsedTargetType.unknown:
                item.target_type = ParsedTargetType.unknown
                item.process_status = ParsedProcessStatus.new
                item.processed_at = None
                item.error_text = None
                unknown += 1
                continue

            if target_type == ParsedTargetType.event:
                if await _is_event_duplicate(db_connect, item):
                    db_connect.delete(item)
                    duplicates_deleted += 1
                    continue

                await _insert_event_from_parsed(db_connect, item, group_lookup=group_lookup)
                item.target_type = ParsedTargetType.event
                item.process_status = ParsedProcessStatus.processed
                item.processed_at = now_utc
                item.error_text = None
                item.deleted_at = now_utc
                processed_events += 1
                continue

            if await _is_news_duplicate(db_connect, item):
                db_connect.delete(item)
                duplicates_deleted += 1
                continue

            await _insert_news_from_parsed(db_connect, item)
            item.target_type = ParsedTargetType.news
            item.process_status = ParsedProcessStatus.processed
            item.processed_at = now_utc
            item.error_text = None
            item.deleted_at = now_utc
            processed_news += 1
        except Exception as exc:
            item.process_status = ParsedProcessStatus.error
            item.processed_at = now_utc
            item.error_text = str(exc)[:500]
            errors += 1

    await db_connect.flush()

    return ParseDistributeResponse(
        requested=len(rows),
        processed_events=processed_events,
        processed_news=processed_news,
        unknown=unknown,
        duplicates_deleted=duplicates_deleted,
        errors=errors,
        cleaned_deleted=cleaned_deleted,
    )


async def backfill_event_categories(
    db_connect: AsyncSession,
    request: ParseCategoryBackfillRequest,
) -> ParseCategoryBackfillResponse:
    group_lookup = await _load_group_lookup(db_connect)
    if not any(group_lookup.values()):
        return ParseCategoryBackfillResponse(
            requested=0,
            linked=0,
            without_match=0,
            errors=0,
        )

    query = (
        select(Events)
        .outerjoin(EventGroupsEvent, EventGroupsEvent.event_id == Events.id)
        .where(
            Events.deleted_at.is_(None),
            EventGroupsEvent.event_id.is_(None),
        )
        .options(selectinload(Events.organization_rel))
        .order_by(Events.created_at.asc(), Events.id.asc())
        .limit(request.limit)
    )
    rows = (await db_connect.execute(query)).scalars().all()

    linked = 0
    without_match = 0
    errors = 0

    for event in rows:
        try:
            category_keys = _detect_category_keys(
                source_key=None,
                text_blob=" ".join(
                    filter(
                        None,
                        [
                            event.name,
                            event.description,
                            event.address,
                            event.external_url,
                            event.organization_rel.name_org if event.organization_rel else None,
                        ],
                    )
                ),
            )
            if not category_keys:
                without_match += 1
                continue

            added = await _link_event_categories(
                db_connect=db_connect,
                event_id=event.id,
                category_keys=category_keys,
                group_lookup=group_lookup,
            )
            if added:
                linked += 1
            else:
                without_match += 1
        except Exception:
            errors += 1

    await db_connect.flush()
    return ParseCategoryBackfillResponse(
        requested=len(rows),
        linked=linked,
        without_match=without_match,
        errors=errors,
    )


async def list_parsed_events(
    db_connect: AsyncSession,
    *,
    limit: int,
    offset: int = 0,
    source_key: str | None = None,
) -> ParsedEventListResponse:
    query = select(ParsedEvent).order_by(ParsedEvent.created_at.desc(), ParsedEvent.id.desc())
    count_query = select(func.count(ParsedEvent.id))

    if source_key:
        query = query.where(ParsedEvent.source_key == source_key)
        count_query = count_query.where(ParsedEvent.source_key == source_key)

    total = (await db_connect.execute(count_query)).scalar() or 0
    rows = (await db_connect.execute(query.offset(offset).limit(limit))).scalars().all()

    return ParsedEventListResponse(
        total=total,
        items=[
            ParsedEventOut(
                id=item.id,
                source_key=item.source_key,
                source_name=item.source_name,
                name=item.name,
                description=item.description,
                date_event=item.date_event,
                duration=item.duration,
                city=item.city,
                price=item.price,
                address=item.address,
                organization=item.organization,
                age_limit=item.age_limit,
                external_url=item.external_url,
                pictures_main=item.pictures_main,
                target_type=item.target_type.value if item.target_type else None,
                process_status=item.process_status.value if item.process_status else None,
                processed_at=item.processed_at,
                error_text=item.error_text,
                created_at=item.created_at,
            )
            for item in rows
        ],
    )


async def _cleanup_soft_deleted_parsed(db_connect: AsyncSession) -> int:
    cutoff = datetime.utcnow() - timedelta(days=3)
    result = await db_connect.execute(
        delete(ParsedEvent).where(
            ParsedEvent.deleted_at.isnot(None),
            ParsedEvent.deleted_at <= cutoff,
        )
    )
    return result.rowcount or 0


def _normalize_text(value: Optional[str]) -> str:
    return " ".join((value or "").strip().split()).lower()


def _normalize_category_key(name: str) -> Optional[str]:
    lowered = _normalize_text(name)
    if not lowered:
        return None
    if "театр" in lowered or "спектак" in lowered:
        return "theater"
    if "кино" in lowered or "фильм" in lowered:
        return "cinema"
    if "спорт" in lowered or "турнир" in lowered or "соревн" in lowered:
        return "sport"
    return None


async def _load_group_lookup(db_connect: AsyncSession) -> dict[str, list[int]]:
    rows = (
        await db_connect.execute(
            select(GroupsEvent.id, GroupsEvent.name).where(GroupsEvent.deleted_at.is_(None))
        )
    ).all()
    lookup: dict[str, list[int]] = {"theater": [], "cinema": [], "sport": []}
    for group_id, group_name in rows:
        key = _normalize_category_key(group_name)
        if key:
            lookup[key].append(group_id)
    return lookup


def _detect_category_keys(*, source_key: Optional[str], text_blob: str) -> set[str]:
    keys: set[str] = set()
    source = _normalize_text(source_key)
    text = _normalize_text(text_blob)

    if source:
        if source in {"northdrama"} or "drama" in source:
            keys.add("theater")
        if source in {"cinema_arthall", "cinema_rodina"} or "cinema" in source:
            keys.add("cinema")
        if source == "arena_norilsk" or "arena" in source:
            keys.add("sport")

    if THEATER_PATTERN.search(text):
        keys.add("theater")
    if CINEMA_PATTERN.search(text):
        keys.add("cinema")
    if SPORT_PATTERN.search(text):
        keys.add("sport")

    return keys


async def _link_event_categories(
    *,
    db_connect: AsyncSession,
    event_id: int,
    category_keys: set[str],
    group_lookup: dict[str, list[int]],
) -> bool:
    group_ids: set[int] = set()
    for category_key in category_keys:
        group_ids.update(group_lookup.get(category_key, []))

    if not group_ids:
        return False

    existing = (
        await db_connect.execute(
            select(EventGroupsEvent.groups_id).where(EventGroupsEvent.event_id == event_id)
        )
    ).scalars().all()
    existing_set = set(existing)

    added = False
    for group_id in sorted(group_ids):
        if group_id in existing_set:
            continue
        db_connect.add(EventGroupsEvent(event_id=event_id, groups_id=group_id))
        added = True
    return added


def _classify_target_type(item: ParsedEvent) -> ParsedTargetType:
    blob = " ".join(
        filter(
            None,
            [
                item.name or "",
                item.description or "",
                item.date_event or "",
                item.duration or "",
                item.price or "",
                item.address or "",
                item.organization or "",
            ],
        )
    )
    text = _normalize_text(blob)
    if not text:
        return ParsedTargetType.unknown

    event_score = 0
    news_score = 0

    if EVENT_TICKET_PATTERN.search(text):
        event_score += 4
    if EVENT_CORE_PATTERN.search(text):
        event_score += 2
    if _extract_schedule(item):
        event_score += 2
    if item.address:
        event_score += 1
    if item.age_limit:
        event_score += 1
    if _parse_price_value(item.price) is not None:
        event_score += 1

    if NEWS_PATTERN.search(text):
        news_score += 4
    if "/news" in (item.external_url or "").lower():
        news_score += 2
    if re.search(r"\b(отчет|итоги|состоялось|прошло|подвели)\b", text):
        news_score += 2

    if event_score >= 4 and event_score >= news_score + 2:
        return ParsedTargetType.event
    if news_score >= 4 and news_score > event_score:
        return ParsedTargetType.news
    return ParsedTargetType.unknown


def _parse_price_value(value: Optional[str]) -> Optional[float]:
    text = _normalize_text(value)
    if not text:
        return None
    if "бесплат" in text:
        return 0.0

    match = re.search(r"(от\s*)?(\d[\d\s]*(?:[.,]\d{1,2})?)", text, flags=re.IGNORECASE)
    if not match:
        return None

    raw_amount = match.group(2).replace(" ", "").replace(",", ".")
    try:
        return float(raw_amount)
    except ValueError:
        return None


def _map_city(value: Optional[str]) -> Optional[CityEnum]:
    text = _normalize_text(value)
    if not text:
        return None

    aliases = {
        "norilsk": CityEnum.norilsk,
        "норильск": CityEnum.norilsk,
        "talnah": CityEnum.talnah,
        "талнах": CityEnum.talnah,
        "kayerkan": CityEnum.kayerkan,
        "кайеркан": CityEnum.kayerkan,
        "oganeer": CityEnum.oganeer,
        "оганер": CityEnum.oganeer,
        "dudinka": CityEnum.dudinka,
        "дудинка": CityEnum.dudinka,
    }
    for key, city in aliases.items():
        if key in text:
            return city
    return None


def _extract_schedule(item: ParsedEvent) -> list[tuple[datetime, time]]:
    seen: set[tuple[datetime, time]] = set()
    candidates = [item.date_event, item.duration, item.description]

    for source in candidates:
        if not source:
            continue
        for match in DATE_TIME_PATTERN.finditer(source):
            date_part = match.group(1)
            time_part = match.group(2) or "00:00"
            try:
                event_date = datetime.strptime(date_part, "%d.%m.%Y")
                start_time = datetime.strptime(time_part, "%H:%M").time()
            except ValueError:
                continue
            event_dt = datetime.combine(event_date.date(), start_time)
            seen.add((event_dt, start_time))

    return sorted(seen, key=lambda item_data: item_data[0])


async def _get_or_create_organization_id(
    db_connect: AsyncSession,
    name: Optional[str],
    address: Optional[str],
) -> Optional[int]:
    normalized_name = (name or "").strip()
    if not normalized_name:
        return None

    existing = (
        await db_connect.execute(
            select(InfoOrganization).where(
                func.lower(InfoOrganization.name_org) == normalized_name.lower(),
                InfoOrganization.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if existing:
        if not existing.address and address:
            existing.address = address
        return existing.id

    org = InfoOrganization(
        name_org=normalized_name,
        address=address,
        organizator=normalized_name,
    )
    db_connect.add(org)
    await db_connect.flush()
    return org.id


async def _is_event_duplicate(db_connect: AsyncSession, item: ParsedEvent) -> bool:
    item_name = _normalize_text(item.name)
    item_address = _normalize_text(item.address)
    item_org = _normalize_text(item.organization)

    query = select(Events.id).where(
        Events.deleted_at.is_(None),
        func.lower(Events.name) == item_name,
    )

    if item.external_url:
        query = query.where(Events.external_url == item.external_url)
    if item_address:
        query = query.where(func.coalesce(func.lower(Events.address), "") == item_address)
    if item_org:
        org_ids = (
            await db_connect.execute(
                select(InfoOrganization.id).where(
                    func.lower(InfoOrganization.name_org) == item_org,
                    InfoOrganization.deleted_at.is_(None),
                )
            )
        ).scalars().all()
        if org_ids:
            query = query.where(Events.organization.in_(org_ids))

    duplicate = (await db_connect.execute(query.limit(1))).scalar_one_or_none()
    return duplicate is not None


async def _is_news_duplicate(db_connect: AsyncSession, item: ParsedEvent) -> bool:
    item_name = _normalize_text(item.name)
    item_org = _normalize_text(item.organization)
    item_address = _normalize_text(item.address)

    query = select(News.id).where(
        News.deleted_at.is_(None),
        func.lower(News.name) == item_name,
        func.coalesce(func.lower(News.organizator), "") == item_org,
    )

    if item_address:
        query = query.where(func.coalesce(func.lower(News.address), "") == item_address)

    duplicate = (await db_connect.execute(query.limit(1))).scalar_one_or_none()
    return duplicate is not None


async def _insert_event_from_parsed(
    db_connect: AsyncSession,
    item: ParsedEvent,
    *,
    group_lookup: dict[str, list[int]],
) -> None:
    organization_id = await _get_or_create_organization_id(
        db_connect,
        name=item.organization,
        address=item.address,
    )
    event = Events(
        name=item.name,
        description=item.description,
        organization=organization_id,
        city=_map_city(item.city),
        price=_parse_price_value(item.price),
        address=item.address,
        age_limit=item.age_limit,
        pictures_main=item.pictures_main,
        external_url=item.external_url,
    )
    db_connect.add(event)
    await db_connect.flush()

    category_keys = _detect_category_keys(
        source_key=item.source_key,
        text_blob=" ".join(
            filter(
                None,
                [
                    item.name,
                    item.description,
                    item.address,
                    item.external_url,
                    item.organization,
                ],
            )
        ),
    )
    await _link_event_categories(
        db_connect=db_connect,
        event_id=event.id,
        category_keys=category_keys,
        group_lookup=group_lookup,
    )

    for event_dt, start_time in _extract_schedule(item):
        db_connect.add(
            TimesEvent(
                event_id=event.id,
                date_event=event_dt,
                start_time=start_time,
            )
        )

    await db_connect.flush()


async def _insert_news_from_parsed(db_connect: AsyncSession, item: ParsedEvent) -> None:
    db_connect.add(
        News(
            name=item.name,
            address=item.address,
            organizator=item.organization,
        )
    )
    await db_connect.flush()


def list_sources() -> list[ParseSourceInfo]:
    return [
        ParseSourceInfo(
            key=source.key,
            name=source.name,
            url=source.url,
            organization=source.organization,
            reserve=source.reserve,
        )
        for source in SOURCE_CONFIGS.values()
    ]
