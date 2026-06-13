from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.session import get_db, get_settings
from core.settings import AppSettings
from src.parser.schemas import (
    ParseCategoryBackfillRequest,
    ParseCategoryBackfillResponse,
    ParseDistributeRequest,
    ParseDistributeResponse,
    ParseImageBackfillRequest,
    ParseImageBackfillResponse,
    ParseLaunchRequest,
    ParseLaunchResponse,
    ParseManualResolveRequest,
    ParseManualResolveResponse,
    ParseSourceInfo,
    ParseStatusUpdateRequest,
    ParseStatusUpdateResponse,
    ParsedEventListResponse,
)
from src.parser.service import (
    backfill_event_images_to_minio,
    backfill_event_categories,
    distribute_parsed_events,
    list_parsed_events,
    list_sources,
    resolve_parsed_event_manually,
    run_parse_and_store,
    update_parsed_event_status,
)
from src.assistant.service import sync_events_vector_index

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
    settings: AppSettings = Depends(get_settings),
) -> ParseDistributeResponse:
    result = await distribute_parsed_events(db_connect=db_connect, request=payload)
    try:
        await sync_events_vector_index(
            db_connect=db_connect,
            settings=settings,
        )
    except Exception:
        # Ошибка обновления векторного индекса не должна отменять перенос данных.
        pass
    return result


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


@router.post(
    "/images/backfill",
    response_model=ParseImageBackfillResponse,
    summary="Ручной перенос изображений events в MinIO",
)
async def backfill_event_images(
    payload: ParseImageBackfillRequest,
    db_connect: AsyncSession = Depends(get_db),
    settings: AppSettings = Depends(get_settings),
) -> ParseImageBackfillResponse:
    return await backfill_event_images_to_minio(
        db_connect=db_connect,
        request=payload,
        settings=settings,
    )


@router.get(
    "/events",
    response_model=ParsedEventListResponse,
    summary="Список импортированных событий из staging-таблицы",
)
async def get_parsed_events(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    source_key: str | None = Query(default=None),
    target_type: str | None = Query(default=None),
    process_status: str | None = Query(default=None),
    db_connect: AsyncSession = Depends(get_db),
) -> ParsedEventListResponse:
    return await list_parsed_events(
        db_connect=db_connect,
        limit=limit,
        offset=offset,
        source_key=source_key,
        target_type=target_type,
        process_status=process_status,
    )


@router.post(
    "/events/{parsed_event_id}/resolve",
    response_model=ParseManualResolveResponse,
    summary="Ручной перенос parsed_event в events/news или отклонение",
)
async def resolve_parsed_event(
    parsed_event_id: int,
    payload: ParseManualResolveRequest,
    db_connect: AsyncSession = Depends(get_db),
    settings: AppSettings = Depends(get_settings),
) -> ParseManualResolveResponse:
    result = await resolve_parsed_event_manually(
        db_connect=db_connect,
        parsed_event_id=parsed_event_id,
        request=payload,
    )
    if result.target_type == "event" and result.process_status == "processed":
        try:
            await sync_events_vector_index(
                db_connect=db_connect,
                settings=settings,
            )
        except Exception:
            pass
    return result


@router.patch(
    "/events/{parsed_event_id}/status",
    response_model=ParseStatusUpdateResponse,
    summary="Ручное обновление process_status для parsed_event",
)
async def patch_parsed_event_status(
    parsed_event_id: int,
    payload: ParseStatusUpdateRequest,
    db_connect: AsyncSession = Depends(get_db),
) -> ParseStatusUpdateResponse:
    return await update_parsed_event_status(
        db_connect=db_connect,
        parsed_event_id=parsed_event_id,
        request=payload,
    )
