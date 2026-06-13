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


class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    organization: Optional[int] = None
    city: Optional[str] = None
    price: Optional[float] = None
    address: Optional[str] = None
    age_limit: Optional[str] = None
    pictures_main: Optional[str] = None
    pictures_two: Optional[str] = None
    external_url: Optional[str] = None
    group_ids: Optional[list[int]] = None
    times: Optional[list[EventTimeIn]] = None


class EventFilter(BaseModel):
    group_id: Optional[list[int]] = None
    date_event: Optional[list[date]] = None
    city: Optional[list[str]] = None


class CalendarEventOut(BaseModel):
    slot_id: int
    event_id: int
    date: str
    time: str
    title: str
    age_limit: Optional[str] = None
    organizer: Optional[str] = None
    is_organizer_event: bool = False


class CalendarEventsResponse(BaseModel):
    total: int
    items: list[CalendarEventOut]
