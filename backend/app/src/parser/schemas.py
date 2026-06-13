from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class ParsedEventCreate(BaseModel):
    source_key: str
    source_name: str
    name: str
    description: Optional[str] = None
    date_event: Optional[str] = None
    start_time: Optional[str] = None
    duration: Optional[str] = None
    city: Optional[str] = None
    price: Optional[str] = None
    address: Optional[str] = None
    organization: Optional[str] = None
    age_limit: Optional[str] = None
    external_url: Optional[str] = None
    pictures_main: Optional[str] = None
    pictures_two: Optional[str] = None
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


class ParseImageBackfillRequest(BaseModel):
    limit: int = Field(default=500, ge=1, le=5000)
    offset: int = Field(default=0, ge=0)
    force: bool = False


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
    start_time: Optional[str] = None
    duration: Optional[str] = None
    city: Optional[str] = None
    price: Optional[str] = None
    address: Optional[str] = None
    organization: Optional[str] = None
    age_limit: Optional[str] = None
    external_url: Optional[str] = None
    pictures_main: Optional[str] = None
    pictures_two: Optional[str] = None
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


class ParseImageBackfillResponse(BaseModel):
    requested: int
    uploaded_main: int
    uploaded_two: int
    fallback_main: int
    fallback_two: int
    already_minio_main: int
    already_minio_two: int
    default_applied_main: int
    default_applied_two: int
    errors: int


class ParsedEventListResponse(BaseModel):
    total: int
    items: list[ParsedEventOut]
