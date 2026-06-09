from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.session import get_db, get_settings
from core.settings import AppSettings
from src.assistant.schemas import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantReindexRequest,
    AssistantReindexResponse,
)
from src.assistant.service import handle_assistant_chat, sync_events_vector_index

router = APIRouter(prefix="/assistant")


@router.post(
    "/chat",
    response_model=AssistantChatResponse,
    summary="Диалог с AI-ассистентом",
)
async def chat_with_assistant(
    payload: AssistantChatRequest,
    db_connect: AsyncSession = Depends(get_db),
    settings: AppSettings = Depends(get_settings),
) -> AssistantChatResponse:
    return await handle_assistant_chat(
        db_connect=db_connect,
        settings=settings,
        request=payload,
    )


@router.post(
    "/reindex",
    response_model=AssistantReindexResponse,
    summary="Ручная переиндексация events в Milvus",
)
async def reindex_assistant_events(
    _: AssistantReindexRequest,
    db_connect: AsyncSession = Depends(get_db),
    settings: AppSettings = Depends(get_settings),
) -> AssistantReindexResponse:
    return await sync_events_vector_index(
        db_connect=db_connect,
        settings=settings,
    )
