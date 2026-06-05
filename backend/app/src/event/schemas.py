from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, Field


class EventTimeIn(BaseModel):
    date_event: datetime
    start_time: time


class EventIn(BaseModel):
    name: str
    description: Optional[str] = None
    organization: Optional[int] = None
    city: Optional[str] = None
    price: Optional[float] = None
    address: Optional[str] = None
    age_limit: Optional[str] = None
    pictures_main: Optional[str] = None
    pictures_two: Optional[str] = None
    external_url: Optional[str] = None
    group_ids: list[int] = Field(default_factory=list)
    times: list[EventTimeIn] = Field(default_factory=list)


class EventFilter(BaseModel):
    group_id: Optional[list[int]] = None
    date_event: Optional[list[date]] = None
    city: Optional[list[str]] = None
