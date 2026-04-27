from datetime import date
from core.session import get_db
from typing import Optional, List
from sqlalchemy import select, and_
from src.event.schemas import EventIn
from database.models import Events, GroupsEvent
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query

router = APIRouter()

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
    event_add = Events(
        name=event_data['name'],
        description=event_data['description'],
        location=event_data['location'],
        group_id=event_data['group_id'],
        external_url=event_data['external_url'],
        date_event=event_data['date_event'],
        duration=event_data['duration'],
        price=event_data['price'],
        address=event_data['address'],
        city=event_data['city'],
        age_limit=event_data['age_limit'],
        picture_url=event_data['picture_url'],
        horizontal_picture_url=event_data['horizontal_picture_url']
    )
    db_connect.add(event_add)
    await db_connect.flush()
    await db_connect.refresh(event_add)
    return EventIn(
        name=event_add.name,
        description=event_add.description,
        location=event_add.location,
        group_id=event_add.group_id,
        external_url=event_add.external_url,
        date_event=event_add.date_event,
        duration=event_add.duration,
        price=event_add.price,
        address=event_add.address,
        city=event_add.city,
        age_limit=event_add.age_limit,
        picture_url=event_add.picture_url,
        horizontal_picture_url=event_add.horizontal_picture_url
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
    events = (await db_connect.execute(select(Events))).scalars().all()

    if not events:
        raise HTTPException(status_code=404, detail="Мероприятия не были найдены!")
    else:
        if group_id is None and date_event is None and city is None:
            return events

        elif group_id is not None and date_event is None and city is None:
            return (await db_connect.execute(select(Events).filter(
                Events.group_id.in_(group_id)
            ))).scalars().all()

        elif date_event is not None and city is None and group_id is None:
            return (await db_connect.execute(select(Events).filter(
                Events.date_event.in_(date_event)
            ))).scalars().all()

        elif city is not None and date_event is None and group_id is None:
            return (await db_connect.execute(select(Events).filter(
                Events.city.in_(city)
            ))).scalars().all()

        else:
            if group_id is not None and date_event is not None and city is None:
                filtered_events = (await db_connect.execute(select(Events).filter(
                    and_(
                        Events.group_id.in_(group_id),
                        Events.date_event.in_(date_event)
                    )
                ))).scalars().all()

            elif group_id is not None and city is not None and date_event is None:
                filtered_events = (await db_connect.execute(select(Events).filter(
                    and_(
                        Events.group_id.in_(group_id),
                        Events.city.in_(city)
                    )
                ))).scalars().all()

            elif date_event is not None and city is not None and group_id is None:
                filtered_events = (await db_connect.execute(select(Events).filter(
                    and_(
                        Events.date_event.in_(date_event),
                        Events.city.in_(city)
                    )
                ))).scalars().all()

            else:
                filtered_events = (await db_connect.execute(select(Events).filter(
                    and_(
                        Events.date_event.in_(date_event),
                        Events.city.in_(city),
                        Events.group_id.in_(group_id)
                    )
                ))).scalars().all()

        return filtered_events


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
    event = (await db_connect.execute(select(Events).filter(Events.id == event_id))).scalar()
    if event is None:
        raise HTTPException(status_code=404,  detail="Нет такого мероприятия!")
    else:
        category_event = (await db_connect.execute(select(GroupsEvent).filter(
            GroupsEvent.id == event.group_id))).scalar()
        if category_event is None:
            raise HTTPException(status_code=404, detail="Данные не были получены!")
        else:
            return category_event.name
