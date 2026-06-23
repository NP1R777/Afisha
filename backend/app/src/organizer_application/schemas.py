from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class OrganizerApplicationCreate(BaseModel):
    message: Optional[str] = None


class OrganizerApplicationOut(BaseModel):
    id: int
    user_id: int
    status: str
    message: Optional[str]
    review_comment: Optional[str]
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ApplicationReview(BaseModel):
    review_comment: Optional[str] = None