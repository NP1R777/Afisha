from datetime import date
from core.session import get_db
from typing import Optional, List
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from src.event.schemas import EventIn, EventTimeIn
from database.models import CityEnum, EventGroupsEvent, Events, GroupsEvent, TimesEvent
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query

router = APIRouter()


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
    group_ids = sorted(set(event_data.get("group_ids") or []))
    if not group_ids:
        raise HTTPException(status_code=422, detail="Нужно передать минимум одну категорию в group_ids")

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
