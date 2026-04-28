from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.session import get_db
from src.parser.schemas import (
    ParseLaunchRequest,
    ParseLaunchResponse,
    ParseSourceInfo,
    ParsedEventListResponse,
)
from src.parser.service import list_parsed_events, list_sources, run_parse_and_store

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
) -> ParseLaunchResponse:
    return await run_parse_and_store(db_connect=db_connect, request=payload)


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
