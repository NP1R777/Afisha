from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.session import get_db, get_settings
from core.settings import AppSettings
from database.models import Events, News, InfoOrganization
from src.event.router import _serialize_event
from src.parser.sources import DEFAULT_ORGANIZATION_DESCRIPTION

router = APIRouter()


class OrganizationCreate(BaseModel):
    name_org: str
    address: str | None = None
    organizator: str | None = None
    description: str | None = None
    picture_org: str | None = None
    external_url: str | None = None


class OrganizationUpdate(BaseModel):
    name_org: str | None = None
    address: str | None = None
    organizator: str | None = None
    description: str | None = None
    picture_org: str | None = None
    external_url: str | None = None


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


async def _ensure_unique_organization_name(
    db_connect: AsyncSession,
    *,
    name_org: str,
    exclude_id: int | None = None,
) -> None:
    query = select(InfoOrganization.id).where(
        func.lower(InfoOrganization.name_org) == name_org.lower(),
        InfoOrganization.deleted_at.is_(None),
    )
    if exclude_id is not None:
        query = query.where(InfoOrganization.id != exclude_id)
    existing_id = (await db_connect.execute(query.limit(1))).scalar_one_or_none()
    if existing_id is not None:
        raise HTTPException(
            status_code=409,
            detail="Организация с таким названием уже существует.",
        )


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


@router.post(
    "/organization",
    summary="Создание организации",
)
async def create_organization(
    payload: OrganizationCreate,
    db_connect: AsyncSession = Depends(get_db),
    settings: AppSettings = Depends(get_settings),
):
    name_org = payload.name_org.strip()
    if not name_org:
        raise HTTPException(status_code=422, detail="name_org не может быть пустым.")
    await _ensure_unique_organization_name(db_connect, name_org=name_org)

    organization = InfoOrganization(
        name_org=name_org,
        address=_normalize_optional_text(payload.address),
        organizator=_normalize_optional_text(payload.organizator),
        description=_normalize_optional_text(payload.description),
        picture_org=_normalize_optional_text(payload.picture_org),
        external_url=_normalize_optional_text(payload.external_url),
    )
    db_connect.add(organization)
    await db_connect.flush()
    await db_connect.refresh(organization)
    return _serialize_organization(organization, settings=settings)


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


@router.patch(
    "/organization/{org_id:int}",
    summary="Обновление организации",
)
async def update_organization(
    org_id: int,
    payload: OrganizationUpdate,
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

    payload_data = payload.dict(exclude_unset=True)
    if "name_org" in payload_data:
        next_name = (payload_data["name_org"] or "").strip()
        if not next_name:
            raise HTTPException(status_code=422, detail="name_org не может быть пустым.")
        await _ensure_unique_organization_name(
            db_connect,
            name_org=next_name,
            exclude_id=org_id,
        )
        organization.name_org = next_name
    for field_name in ("address", "organizator", "description", "picture_org", "external_url"):
        if field_name in payload_data:
            setattr(organization, field_name, _normalize_optional_text(payload_data[field_name]))

    organization.update_at = datetime.utcnow()
    await db_connect.flush()
    await db_connect.refresh(organization)
    return _serialize_organization(organization, settings=settings)


@router.delete(
    "/organization/{org_id:int}",
    summary="Удаление организации",
)
async def delete_organization(
    org_id: int,
    db_connect: AsyncSession = Depends(get_db),
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

    now = datetime.utcnow()
    organization.deleted_at = now
    organization.update_at = now
    await db_connect.flush()
    return {"message": "Организация успешно удалена"}
