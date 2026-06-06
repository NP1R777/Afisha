from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.session import get_db, get_settings
from core.settings import AppSettings
from src.parser.schemas import (
    ParseCategoryBackfillRequest,
    ParseCategoryBackfillResponse,
    ParseDistributeRequest,
    ParseDistributeResponse,
    ParseLaunchRequest,
    ParseLaunchResponse,
    ParseSourceInfo,
    ParsedEventListResponse,
)
from src.parser.service import (
    backfill_event_categories,
    distribute_parsed_events,
    list_parsed_events,
    list_sources,
    run_parse_and_store,
)

router = APIRouter(prefix="/parser")


@router.get(
    "/sources",
    response_model=list[ParseSourceInfo],
    summary="Список доступных источников для парсинга",
)
async def get_sources() -> list[ParseSourceInfo]:
    return list_sources()


@router.post(
    "/run",
    response_model=ParseLaunchResponse,
    summary="Ручной запуск парсинга и записи в staging-таблицу",
)
async def run_parser(
    payload: ParseLaunchRequest,
    db_connect: AsyncSession = Depends(get_db),
    settings: AppSettings = Depends(get_settings),
) -> ParseLaunchResponse:
    return await run_parse_and_store(
        db_connect=db_connect,
        request=payload,
        settings=settings,
    )


@router.post(
    "/distribute",
    response_model=ParseDistributeResponse,
    summary="Ручной перенос staging-данных в events/news",
)
async def distribute_parser_events(
    payload: ParseDistributeRequest,
    db_connect: AsyncSession = Depends(get_db),
) -> ParseDistributeResponse:
    return await distribute_parsed_events(db_connect=db_connect, request=payload)


@router.post(
    "/categories/backfill",
    response_model=ParseCategoryBackfillResponse,
    summary="Ручная привязка категорий к events без категорий",
)
async def backfill_parser_event_categories(
    payload: ParseCategoryBackfillRequest,
    db_connect: AsyncSession = Depends(get_db),
) -> ParseCategoryBackfillResponse:
    return await backfill_event_categories(db_connect=db_connect, request=payload)


@router.get(
    "/events",
    response_model=ParsedEventListResponse,
    summary="Список импортированных событий из staging-таблицы",
)
async def get_parsed_events(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    source_key: str | None = Query(default=None),
    db_connect: AsyncSession = Depends(get_db),
) -> ParsedEventListResponse:
    return await list_parsed_events(
        db_connect=db_connect,
        limit=limit,
        offset=offset,
        source_key=source_key,
    )
