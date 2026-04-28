import uuid
from typing import Optional
from datetime import datetime
from typing_extensions import List
from pydantic import BaseModel, Field, EmailStr


class UserIn:
    class Create(BaseModel):
        username: str
        password: str
        email: EmailStr
        date_of_birth: str
        preferences: List[int]

    class Login(BaseModel):
        username: str
        password: str


class UserTokenPayload(BaseModel):
    jti: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: int


class UserOut:

    class Base(BaseModel):
        created_at: datetime | None
        update_at: datetime | None
        deleted_at: datetime | None
        id: int

    class Create(Base):
        username: str
        email: EmailStr
        date_of_birth: str | None
        preferences: List[int]

    class Me(Base):
        username: str
        password: str
        refresh_token: str


class UserUpdate(BaseModel):
    username: str | None
    password: str | None
    email: EmailStr | None
    date_of_birth: str | None
    preferences: List[int] | None


class UserUpdatePreferences(BaseModel):
    preferences: List[int] | None


class UserOutLikeEvents(BaseModel):
    like_events: Optional[List[int]] = Field(default_factory=list)

class UserUpdateLikeEvents(BaseModel):
    like_events: List[int]


class TokenResponse(BaseModel):
    user_id: int
    username: str
    access_token: str | None
    refresh_token: str | None
    token_type: str
