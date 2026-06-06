from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.session import get_db
from database.models import News
from src.news.schemas import NewsOut, NewsUpdate

router = APIRouter()


@router.get(
    "/news/all",
    response_model=list[NewsOut],
    description="Получение всех новостей из базы данных",
    summary="Получение всех новостей из базы данных",
    responses={
        200: {"description": "Новости успешно получены"},
        500: {"description": "Не удалось получить новости"},
    },
)
async def get_all_news(
    db_connect: AsyncSession = Depends(get_db),
) -> list[NewsOut]:
    news_rows = (
        await db_connect.execute(
            select(News)
            .where(News.deleted_at.is_(None))
            .order_by(News.id.desc())
        )
    ).scalars().all()
    return news_rows


@router.get(
    "/news/{news_id}",
    response_model=NewsOut,
    description="Получение конкретной новости по id",
    summary="Получение конкретной новости по id",
    responses={
        200: {"description": "Новость успешно получена"},
        404: {"description": "Новость не найдена"},
    },
)
async def get_news_by_id(
    news_id: int,
    db_connect: AsyncSession = Depends(get_db),
) -> NewsOut:
    news_item = (
        await db_connect.execute(
            select(News).where(
                News.id == news_id,
                News.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if news_item is None:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    return news_item


@router.patch(
    "/news/{news_id}",
    response_model=NewsOut,
    description="Изменение конкретной новости по id",
    summary="Изменение конкретной новости по id",
    responses={
        200: {"description": "Новость успешно изменена"},
        404: {"description": "Новость не найдена"},
    },
)
async def update_news_by_id(
    news_id: int,
    payload: NewsUpdate,
    db_connect: AsyncSession = Depends(get_db),
) -> NewsOut:
    news_item = (
        await db_connect.execute(
            select(News).where(
                News.id == news_id,
                News.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if news_item is None:
        raise HTTPException(status_code=404, detail="Новость не найдена")

    if payload.name is not None:
        news_item.name = payload.name
    if payload.address is not None:
        news_item.address = payload.address
    if payload.organizator is not None:
        news_item.organizator = payload.organizator
    news_item.update_at = datetime.utcnow()

    await db_connect.commit()
    await db_connect.refresh(news_item)
    return news_item


@router.delete(
    "/news/{news_id}",
    description="Удаление конкретной новости по id",
    summary="Удаление конкретной новости по id",
    responses={
        200: {"description": "Новость успешно удалена"},
        404: {"description": "Новость не найдена"},
    },
)
async def delete_news_by_id(
    news_id: int,
    db_connect: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    news_item = (
        await db_connect.execute(
            select(News).where(
                News.id == news_id,
                News.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if news_item is None:
        raise HTTPException(status_code=404, detail="Новость не найдена")

    news_item.deleted_at = datetime.utcnow()
    news_item.update_at = datetime.utcnow()
    await db_connect.commit()

    return {"message": "Новость успешно удалена"}
