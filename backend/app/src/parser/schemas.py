from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ParsedEventCreate(BaseModel):
    source_key: str
    source_name: str
    name: str
    description: Optional[str] = None
    date_event: Optional[str] = None
    duration: Optional[str] = None
    city: Optional[str] = None
    price: Optional[str] = None
    address: Optional[str] = None
    organization: Optional[str] = None
    age_limit: Optional[str] = None
    external_url: Optional[str] = None
    target_type: Optional[Literal["event", "news", "unknown"]] = None
    process_status: Optional[Literal["new", "processed", "rejected", "error"]] = None
    processed_at: Optional[datetime] = None
    error_text: Optional[str] = None


class ParseLaunchRequest(BaseModel):
    source_keys: Optional[list[str]] = None
    include_reserve: bool = False
    max_events_per_source: int = Field(default=100, ge=1, le=500)


class ParseDistributeRequest(BaseModel):
    limit: int = Field(default=200, ge=1, le=1000)
    source_key: Optional[str] = None


class ParseCategoryBackfillRequest(BaseModel):
    limit: int = Field(default=1000, ge=1, le=10000)


class ParseRunStats(BaseModel):
    source_key: str
    source_name: str
    fetched: int
    inserted: int
    duplicates: int
    errors: int


class ParseSourceInfo(BaseModel):
    key: str
    name: str
    url: str
    organization: str
    reserve: bool


class ParsedEventOut(BaseModel):
    id: int
    source_key: str
    source_name: str
    name: str
    description: Optional[str] = None
    date_event: Optional[str] = None
    duration: Optional[str] = None
    city: Optional[str] = None
    price: Optional[str] = None
    address: Optional[str] = None
    organization: Optional[str] = None
    age_limit: Optional[str] = None
    external_url: Optional[str] = None
    target_type: Optional[Literal["event", "news", "unknown"]] = None
    process_status: Optional[Literal["new", "processed", "rejected", "error"]] = None
    processed_at: Optional[datetime] = None
    error_text: Optional[str] = None
    created_at: Optional[datetime] = None


class ParseLaunchResponse(BaseModel):
    requested_sources: list[str]
    total_fetched: int
    total_inserted: int
    total_duplicates: int
    total_errors: int
    stats: list[ParseRunStats]


class ParseDistributeResponse(BaseModel):
    requested: int
    processed_events: int
    processed_news: int
    unknown: int
    duplicates_deleted: int
    errors: int
    cleaned_deleted: int


class ParseCategoryBackfillResponse(BaseModel):
    requested: int
    linked: int
    without_match: int
    errors: int


class ParsedEventListResponse(BaseModel):
    total: int
    items: list[ParsedEventOut]
