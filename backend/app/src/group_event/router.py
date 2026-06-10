from sqlalchemy import select
from core.session import get_db
from database.models import GroupsEvent
from sqlalchemy.ext.asyncio import AsyncSession
from src.group_event.schemas import GroupEventIn
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter()


@router.post(
    "/event/create_group_event",
    response_model=GroupEventIn,
    description="Добавление новых категорий в базу данных",
    summary="Добавление новых категорий в базу данных",
    responses={
        200: {"description": "Категория успешно создана"},
        500: {"description": "При создании категории произошла ошибка"}
    }
)
async def create_group_event(
        group_event: GroupEventIn,
        db_connect: AsyncSession = Depends(get_db)
):
    group_event_data = group_event.dict()
    group_event_add = GroupsEvent(**group_event_data)
    db_connect.add(group_event_add)
    await db_connect.flush()
    await db_connect.refresh(group_event_add)
    return GroupEventIn(**group_event_data)


@router.get(
    "/event/event_list",
    description="Получение всех существующих категорий мероприятий",
    summary="Получение всех существующих категорий мероприятий",
    responses={
        200: {"decsription": "Категории успешно получены!"},
        500: {"description": "Во время получения данных произошла ошибка"}
    }
)
async def get_group_events_list(db_connect: AsyncSession = Depends(get_db)):
    category_events = (await db_connect.execute(select(GroupsEvent))).scalars().all()
    if not category_events:
        raise HTTPException(status_code=404, detail="При получении данных произошла ошибка")
    else:
        return category_events
