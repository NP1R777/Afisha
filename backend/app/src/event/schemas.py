from pydantic import BaseModel
from datetime import date, time

class EventIn(BaseModel):
    name: str
    description: str
    location: str
    group_id: int
    external_url: str
    date_event: date
    duration: time
    price: int
    address: str
    city: str
    age_limit: str
    picture_url: str
    horizontal_picture_url: str
