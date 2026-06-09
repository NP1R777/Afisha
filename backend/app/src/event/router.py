from datetime import date, datetime
from core.session import get_db
from typing import Optional, List
from sqlalchemy import delete, func, select
from sqlalchemy.orm import selectinload
from src.event.schemas import EventIn, EventTimeIn, EventUpdate
from database.models import (
    CityEnum,
    EventGroupsEvent,
    Events,
    GroupsEvent,
    TimesEvent,
    UserToEvent,
)
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query

router = APIRouter()


def _normalize_ids(raw_values: list[int] | None) -> list[int]:
    if not raw_values:
        return []
    return sorted(set(raw_values))


async def _validate_group_ids(
    db_connect: AsyncSession,
    group_ids: list[int],
) -> None:
    if not group_ids:
        return
    existing_group_ids = set(
        (
            await db_connect.execute(
                select(GroupsEvent.id).where(GroupsEvent.id.in_(group_ids))
            )
        ).scalars().all()
    )
    missing_group_ids = sorted(set(group_ids) - existing_group_ids)
    if missing_group_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Не найдены категории: {missing_group_ids}",
        )


async def _replace_event_groups(
    db_connect: AsyncSession,
    *,
    event_id: int,
    group_ids: list[int],
) -> None:
    await db_connect.execute(delete(EventGroupsEvent).where(EventGroupsEvent.event_id == event_id))
    for group_id in group_ids:
        db_connect.add(EventGroupsEvent(event_id=event_id, groups_id=group_id))


async def _replace_event_times(
    db_connect: AsyncSession,
    *,
    event_id: int,
    times_payload: list[dict],
) -> None:
    await db_connect.execute(delete(TimesEvent).where(TimesEvent.event_id == event_id))
    for item in times_payload:
        db_connect.add(
            TimesEvent(
                event_id=event_id,
                date_event=item["date_event"],
                start_time=item["start_time"],
            )
        )


async def _load_event_with_relations(
    db_connect: AsyncSession,
    *,
    event_id: int,
) -> Events | None:
    return (
        await db_connect.execute(
            select(Events)
            .where(Events.id == event_id)
            .options(
                selectinload(Events.group_links).selectinload(EventGroupsEvent.group),
                selectinload(Events.time_slots),
            )
        )
    ).scalars().first()


def _serialize_event(event: Events) -> dict:
    return {
        "id": event.id,
        "name": event.name,
        "description": event.description,
        "organization": event.organization,
        "city": event.city.value if event.city else None,
        "price": event.price,
        "address": event.address,
        "age_limit": event.age_limit,
        "pictures_main": event.pictures_main,
        "pictures_two": event.pictures_two,
        "external_url": event.external_url,
        "group_ids": sorted({item.groups_id for item in event.group_links}),
        "time_slots": [
            {
                "id": slot.id,
                "event_id": slot.event_id,
                "date_event": slot.date_event,
                "start_time": slot.start_time,
            }
            for slot in sorted(event.time_slots, key=lambda value: value.date_event)
        ],
        "created_at": event.created_at,
        "update_at": event.update_at,
        "deleted_at": event.deleted_at,
    }


def _parse_city(raw_city: Optional[str]) -> Optional[CityEnum]:
    if raw_city is None:
        return None
    try:
        return CityEnum(raw_city)
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=f"city должен быть одним из: {', '.join(item.value for item in CityEnum)}",
        )

@router.post(
    '/event/create_event',
    response_model=EventIn,
    description="Заполнения мероприятия в базе данных",
    summary="Заполнение мероприятия в базе данных",
    responses={
        200: {"description": "Мероприятие создано!"},
        500: {"description": "Ошибка создания мероприятия"}
    }
)
async def create_event(
        event: EventIn,
        db_connect: AsyncSession = Depends(get_db)
):
    event_data = event.dict()
    group_ids = _normalize_ids(event_data.get("group_ids"))
    if not group_ids:
        raise HTTPException(status_code=422, detail="Нужно передать минимум одну категорию в group_ids")

    await _validate_group_ids(db_connect, group_ids)

    event_add = Events(
        name=event_data['name'],
        description=event_data['description'],
        organization=event_data['organization'],
        city=_parse_city(event_data['city']),
        price=event_data['price'],
        address=event_data['address'],
        age_limit=event_data['age_limit'],
        pictures_main=event_data['pictures_main'],
        pictures_two=event_data['pictures_two'],
        external_url=event_data['external_url'],
    )
    db_connect.add(event_add)
    await db_connect.flush()

    for group_id in group_ids:
        db_connect.add(EventGroupsEvent(event_id=event_add.id, groups_id=group_id))

    times_payload = event_data.get("times") or []
    for item in times_payload:
        db_connect.add(
            TimesEvent(
                event_id=event_add.id,
                date_event=item["date_event"],
                start_time=item["start_time"],
            )
        )

    await db_connect.flush()
    return EventIn(
        name=event_add.name,
        description=event_add.description,
        organization=event_add.organization,
        city=event_add.city.value if event_add.city else None,
        price=event_add.price,
        address=event_add.address,
        age_limit=event_add.age_limit,
        pictures_main=event_add.pictures_main,
        pictures_two=event_add.pictures_two,
        external_url=event_add.external_url,
        group_ids=group_ids,
        times=[EventTimeIn(**item) for item in times_payload],
    )


@router.patch(
    "/event/{event_id}",
    description="Обновление существующего мероприятия по id",
    summary="Обновление существующего мероприятия по id",
    responses={
        200: {"description": "Мероприятие успешно обновлено"},
        404: {"description": "Мероприятие не найдено"},
    },
)
async def update_event_by_id(
    event_id: int,
    payload: EventUpdate,
    db_connect: AsyncSession = Depends(get_db),
):
    event = await _load_event_with_relations(db_connect, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено!")
    if event.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Мероприятие уже удалено")

    payload_data = payload.dict(exclude_unset=True)

    if "name" in payload_data and payload_data["name"] is not None:
        event.name = payload_data["name"]
    if "description" in payload_data:
        event.description = payload_data["description"]
    if "organization" in payload_data:
        event.organization = payload_data["organization"]
    if "city" in payload_data:
        event.city = _parse_city(payload_data["city"]) if payload_data["city"] is not None else None
    if "price" in payload_data:
        event.price = payload_data["price"]
    if "address" in payload_data:
        event.address = payload_data["address"]
    if "age_limit" in payload_data:
        event.age_limit = payload_data["age_limit"]
    if "pictures_main" in payload_data:
        event.pictures_main = payload_data["pictures_main"]
    if "pictures_two" in payload_data:
        event.pictures_two = payload_data["pictures_two"]
    if "external_url" in payload_data:
        event.external_url = payload_data["external_url"]

    if "group_ids" in payload_data:
        group_ids = _normalize_ids(payload_data["group_ids"])
        await _validate_group_ids(db_connect, group_ids)
        await _replace_event_groups(
            db_connect,
            event_id=event_id,
            group_ids=group_ids,
        )

    if "times" in payload_data:
        times_payload = payload_data["times"] or []
        await _replace_event_times(
            db_connect,
            event_id=event_id,
            times_payload=times_payload,
        )

    event.update_at = datetime.utcnow()
    await db_connect.flush()

    updated_event = await _load_event_with_relations(db_connect, event_id=event_id)
    if not updated_event:
        raise HTTPException(status_code=404, detail="Не удалось получить обновленное мероприятие")
    return _serialize_event(updated_event)


@router.delete(
    "/event/{event_id}",
    description="Полное удаление мероприятия по id",
    summary="Удаление мероприятия по id",
    responses={
        200: {"description": "Мероприятие удалено"},
        404: {"description": "Мероприятие не найдено"},
    },
)
async def delete_event_by_id(
    event_id: int,
    db_connect: AsyncSession = Depends(get_db),
):
    event = (
        await db_connect.execute(
            select(Events).where(Events.id == event_id)
        )
    ).scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено!")

    await db_connect.execute(delete(UserToEvent).where(UserToEvent.event_id == event_id))
    await db_connect.execute(delete(EventGroupsEvent).where(EventGroupsEvent.event_id == event_id))
    await db_connect.execute(delete(TimesEvent).where(TimesEvent.event_id == event_id))
    await db_connect.delete(event)
    await db_connect.flush()

    return {"message": "Мероприятие удалено полностью", "event_id": event_id}


@router.get(
    f'/event/events',
    description="Получение всех мероприятий из базы данных",
    summary="Получение всех мероприятий из базы данных",
    responses={
        200: {"description": "Мероприятия успешно получены!"},
        500: {"description": "Не удалось получить все мероприятия."}
    }
)
async def get_all_events(db_connect: AsyncSession = Depends(get_db),
                         group_id: Optional[List[int]] = Query(None),
                         date_event: Optional[List[date]] = Query(None),
                         city: Optional[List[str]] = Query(None)):
    query = (
        select(Events)
        .where(Events.deleted_at.is_(None))
        .options(
            selectinload(Events.group_links),
            selectinload(Events.time_slots),
        )
    )

    if group_id:
        query = query.join(EventGroupsEvent).where(EventGroupsEvent.groups_id.in_(group_id))

    if date_event:
        query = query.join(TimesEvent).where(func.date(TimesEvent.date_event).in_(date_event))

    if city:
        city_values = [_parse_city(item) for item in city]
        query = query.where(Events.city.in_(city_values))

    events = (
        await db_connect.execute(
            query.distinct().order_by(Events.id.desc())
        )
    ).scalars().all()

    if not events:
        raise HTTPException(status_code=404, detail="Мероприятия не были найдены!")

    return events


@router.get(
    '/event/event{id}/',
    description="Получение мероприятия по id",
    summary="Получение мероприятия по id",
    responses={
        200: {"description": "Мероприятие успешно получено!"},
        500: {"description": "При получении мероприятия произошла ошибка"}
    }
)
async def get_event_by_id(event_id: int,
                          db_connect: AsyncSession = Depends(get_db)):
    event = (await db_connect.execute(select(Events).filter(Events.id == event_id))).scalar()
    if not event:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено!")
    else:
        return event


@router.get(
    '/event/event_category{event_id}/',
    description="Получение категории мероприятия по id мероприятия",
    summary="Получение категории мероприятия по id мероприятия",
    responses={
        200: {"description": "Категория успешно найдена!"},
        500: {"description": "Категорию не удалось найти"}
    }
)
async def get_event_category_by_id(event_id: int,
                                   db_connect: AsyncSession = Depends(get_db)):
    event = (await db_connect.execute(select(Events).filter(Events.id == event_id))).scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=404,  detail="Нет такого мероприятия!")

    categories = (
        await db_connect.execute(
            select(GroupsEvent.name)
            .join(EventGroupsEvent, EventGroupsEvent.groups_id == GroupsEvent.id)
            .where(EventGroupsEvent.event_id == event_id)
            .order_by(GroupsEvent.name.asc())
        )
    ).scalars().all()

    if not categories:
        raise HTTPException(status_code=404, detail="Данные не были получены!")

    return categories
