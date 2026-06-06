from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NewsOut(BaseModel):
    id: int
    created_at: datetime
    update_at: datetime
    deleted_at: Optional[datetime] = None
    name: str
    address: Optional[str] = None
    organizator: Optional[str] = None


class NewsUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    organizator: Optional[str] = None
