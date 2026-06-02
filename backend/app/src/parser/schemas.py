from datetime import datetime
from typing import Optional

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


class ParseLaunchRequest(BaseModel):
    source_keys: Optional[list[str]] = None
    include_reserve: bool = False
    max_events_per_source: int = Field(default=100, ge=1, le=500)


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
    created_at: Optional[datetime] = None


class ParseLaunchResponse(BaseModel):
    requested_sources: list[str]
    total_fetched: int
    total_inserted: int
    total_duplicates: int
    total_errors: int
    stats: list[ParseRunStats]


class ParsedEventListResponse(BaseModel):
    total: int
    items: list[ParsedEventOut]
