from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.settings import AppSettings
from database.models import ParsedEvent
from src.parser.schemas import (
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
                target_type=item.target_type.value if item.target_type else None,
                process_status=item.process_status.value if item.process_status else None,
                processed_at=item.processed_at,
                error_text=item.error_text,
                created_at=item.created_at,
            )
            for item in rows
        ],
    )


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
