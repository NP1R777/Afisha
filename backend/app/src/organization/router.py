from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.session import get_db, get_settings
from core.settings import AppSettings
from database.models import Events, News, InfoOrganization
from src.event.router import _serialize_event
from src.parser.sources import DEFAULT_ORGANIZATION_DESCRIPTION

router = APIRouter()


def _serialize_news(item: News) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "address": item.address,
        "organizator": item.organizator,
        "organization": item.organization,
        "created_at": item.created_at,
        "update_at": item.update_at,
        "deleted_at": item.deleted_at,
    }


def _event_sort_key(event: dict):
    time_slots = event.get("time_slots") or []
    if time_slots:
        return (0, time_slots[0]["date_event"])
    # Events without scheduled shows go last, newest first.
    return (1, -event["id"])


def _serialize_organization(
    organization: InfoOrganization,
    *,
    settings: AppSettings,
) -> dict:
    return {
        "id": organization.id,
        "name_org": organization.name_org,
        "address": organization.address,
        "organizator": organization.organizator,
        "description": organization.description or DEFAULT_ORGANIZATION_DESCRIPTION,
        "picture_org": organization.picture_org or settings.default_event_detail_image_url,
        "external_url": organization.external_url or organization.organizator,
        "created_at": organization.created_at,
        "update_at": organization.update_at,
        "deleted_at": organization.deleted_at,
    }


@router.get(
    "/organizations",
    summary="Список организаций",
)
async def list_organizations(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, description="Поиск по названию организации"),
    db_connect: AsyncSession = Depends(get_db),
    settings: AppSettings = Depends(get_settings),
):
    query = select(InfoOrganization).where(InfoOrganization.deleted_at.is_(None))
    count_query = select(func.count(InfoOrganization.id)).where(InfoOrganization.deleted_at.is_(None))

    normalized_query = " ".join((q or "").strip().lower().split())
    if normalized_query:
        search_filter = func.lower(InfoOrganization.name_org).like(f"%{normalized_query}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = (await db_connect.execute(count_query)).scalar() or 0
    rows = (
        await db_connect.execute(
            query.order_by(InfoOrganization.name_org.asc(), InfoOrganization.id.asc())
            .offset(offset)
            .limit(limit)
        )
    ).scalars().all()

    return {
        "total": total,
        "items": [
            _serialize_organization(organization, settings=settings)
            for organization in rows
        ],
    }


@router.get(
    "/organization/{org_id:int}",
    description=(
        "Получение информации об организаторе вместе с его мероприятиями "
        "и новостями для страницы организатора."
    ),
    summary="Информация об организаторе для страницы организатора",
    responses={
        200: {"description": "Данные организатора получены"},
        404: {"description": "Организатор не найден"},
    },
)
async def get_organization_page(
    org_id: int,
    events_limit: int = Query(default=50, ge=1, le=200),
    news_limit: int = Query(default=50, ge=1, le=200),
    db_connect: AsyncSession = Depends(get_db),
    settings: AppSettings = Depends(get_settings),
):
    organization = (
        await db_connect.execute(
            select(InfoOrganization).where(
                InfoOrganization.id == org_id,
                InfoOrganization.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if organization is None:
        raise HTTPException(status_code=404, detail="Организатор не найден")

    events = (
        await db_connect.execute(
            select(Events)
            .where(
                Events.organization == org_id,
                Events.deleted_at.is_(None),
            )
            .options(
                selectinload(Events.group_links),
                selectinload(Events.time_slots),
            )
        )
    ).scalars().all()

    news_rows = (
        await db_connect.execute(
            select(News)
            .where(
                News.organization == org_id,
                News.deleted_at.is_(None),
            )
            .order_by(News.id.desc())
            .limit(news_limit)
        )
    ).scalars().all()

    serialized_events = [_serialize_event(event) for event in events]
    serialized_events.sort(key=_event_sort_key)
    serialized_events = serialized_events[:events_limit]

    return {
        **_serialize_organization(organization, settings=settings),
        "events": serialized_events,
        "news": [_serialize_news(item) for item in news_rows],
    }
