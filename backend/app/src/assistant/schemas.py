from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    top_k: int = Field(default=5, ge=1, le=20)


class AssistantFiltersOut(BaseModel):
    category: Optional[str] = None
    city: Optional[str] = None
    organization: Optional[str] = None
    requested_date: Optional[date] = None
    time_period: Optional[Literal["morning", "day", "evening", "night"]] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    age_limit: Optional[int] = None


class AssistantEventMatch(BaseModel):
    event_id: int
    name: str
    description: Optional[str] = None
    city: Optional[str] = None
    organization: Optional[str] = None
    price: Optional[float] = None
    age_limit: Optional[str] = None
    address: Optional[str] = None
    external_url: Optional[str] = None
    pictures_main: Optional[str] = None
    categories: list[str] = Field(default_factory=list)
    date_event: Optional[datetime] = None
    start_time: Optional[str] = None
    score: float = 0.0
    reason: str


class AssistantChatResponse(BaseModel):
    intent: Literal["afisha_search", "general_chat"]
    message: str
    fallback_level: Literal["none", "exact", "similar", "alternative", "empty"]
    filters: AssistantFiltersOut
    matches: list[AssistantEventMatch] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class AssistantReindexRequest(BaseModel):
    force: bool = False


class AssistantReindexResponse(BaseModel):
    success: bool
    collection_name: str
    indexed_events: int
    indexed_documents: int
    duration_ms: int
    error: Optional[str] = None
