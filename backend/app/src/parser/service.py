from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import ParsedEvent
from src.parser.schemas import (
    ParseLaunchRequest,
    ParseLaunchResponse,
    ParseRunStats,
    ParseSourceInfo,
    ParsedEventListResponse,
    ParsedEventOut,
)
from src.parser.sources import SOURCE_CONFIGS, parse_source, resolve_source_keys


async def run_parse_and_store(
    db_connect: AsyncSession,
    request: ParseLaunchRequest,
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

    for source_key in source_keys:
        source = SOURCE_CONFIGS[source_key]
        fetched = 0
        inserted = 0
        duplicates = 0
        errors = 0

        try:
            parsed_items = parse_source(source, max_events=request.max_events_per_source)
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
