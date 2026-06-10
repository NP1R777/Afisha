import uuid
from enum import Enum
from typing import Optional
from datetime import datetime
from typing_extensions import List
from pydantic import BaseModel, Field, EmailStr
from typing import Literal


class UserRole(str, Enum):
    user = "user"
    admin = "admin"
    organizator = "organizator"


class UserIn:
    class Create(BaseModel):
        username: str
        password: str
        email: EmailStr
        date_of_birth: str
        preferences: List[int]

        # Поле для Swagger (будет выпадающий список)
        role: UserRole = Field(
            default=UserRole.user,
            description="Роль пользователя: user/admin/organizator",
        )


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


class UserUpdateRole(BaseModel):
    role: Literal["user", "admin", "organizator"]


class UserAdminOut(BaseModel):
    id: int
    username: str
    email: EmailStr | None = None
    date_of_birth: str | None = None
    role: Literal["user", "admin", "organizator"] | None = None
    preferences: list[int] = Field(default_factory=list)
    created_at: datetime | None = None
    update_at: datetime | None = None
    deleted_at: datetime | None = None


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
