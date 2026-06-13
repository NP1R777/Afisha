import enum
from datetime import date, datetime, time

from sqlalchemy import (
    DATE,
    TIMESTAMP,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    TIME,
    Text,
    UniqueConstraint,
    text,
    MetaData,
)
from sqlalchemy.orm import DeclarativeBase, relationship


convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}

NOW_AT_UTC = text("timezone('utc', now())")


class CityEnum(str, enum.Enum):
    norilsk = "norilsk"
    talnah = "talnah"
    kayerkan = "kayerkan"
    oganeer = "oganeer"
    dudinka = "dudinka"


class RoleEnum(str, enum.Enum):
    user = "user"
    admin = "admin"
    organizator = "organizator"


class ParsedTargetType(str, enum.Enum):
    event = "event"
    news = "news"
    unknown = "unknown"


class ParsedProcessStatus(str, enum.Enum):
    new = "new"
    processed = "processed"
    rejected = "rejected"
    error = "error"


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)


class User(Base):
    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC, nullable=False)
    update_at: datetime = Column(
        TIMESTAMP(timezone=False),
        server_default=NOW_AT_UTC,
        onupdate=NOW_AT_UTC,
        nullable=False,
    )
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    username: str = Column(String, nullable=False, unique=True)
    password_hash: str = Column(String, nullable=False)
    email: str = Column(String, nullable=False, unique=True)
    date_of_birth: date = Column(DATE, nullable=False)
    refresh_token: str = Column(String, nullable=True)

    role = relationship("Roles", back_populates="user", uselist=False)
    preferred_groups = relationship("UserGroupsEvent", back_populates="user", cascade="all, delete-orphan")
    liked_events = relationship("UserToEvent", back_populates="user", cascade="all, delete-orphan")


class Roles(Base):
    __tablename__ = "roles"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC, nullable=False)
    update_at: datetime = Column(
        TIMESTAMP(timezone=False),
        server_default=NOW_AT_UTC,
        onupdate=NOW_AT_UTC,
        nullable=False,
    )
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    user_id: int = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    role: RoleEnum = Column(
        Enum(RoleEnum, name="role_enum"),
        nullable=False,
        server_default=RoleEnum.user.value,
    )

    user = relationship("User", back_populates="role")


class GroupsEvent(Base):
    __tablename__ = "groups_event"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC, nullable=False)
    update_at: datetime = Column(
        TIMESTAMP(timezone=False),
        server_default=NOW_AT_UTC,
        onupdate=NOW_AT_UTC,
        nullable=False,
    )
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    name: str = Column(String, nullable=False, unique=True)
    description: str = Column(String, nullable=True)

    user_links = relationship("UserGroupsEvent", back_populates="group", cascade="all, delete-orphan")
    event_links = relationship("EventGroupsEvent", back_populates="group", cascade="all, delete-orphan")


class InfoOrganization(Base):
    __tablename__ = "info_organization"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC, nullable=False)
    update_at: datetime = Column(
        TIMESTAMP(timezone=False),
        server_default=NOW_AT_UTC,
        onupdate=NOW_AT_UTC,
        nullable=False,
    )
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    name_org: str = Column(String, nullable=False)
    address: str = Column(String, nullable=True)
    organizator: str = Column(String, nullable=True)

    events = relationship("Events", back_populates="organization_rel")


class Events(Base):
    __tablename__ = "events"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC, nullable=False)
    update_at: datetime = Column(
        TIMESTAMP(timezone=False),
        server_default=NOW_AT_UTC,
        onupdate=NOW_AT_UTC,
        nullable=False,
    )
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    name: str = Column(String, nullable=False)
    description: str = Column(String, nullable=True)
    organization: int = Column(Integer, ForeignKey("info_organization.id"), nullable=True)
    city: CityEnum = Column(Enum(CityEnum, name="city_enum"), nullable=True)
    price: float = Column(Float, nullable=True)
    address: str = Column(String, nullable=True)
    age_limit: str = Column(String, nullable=True)
    pictures_main: str = Column(String, nullable=True)
    pictures_two: str = Column(String, nullable=True)
    external_url: str = Column(Text, nullable=True)

    organization_rel = relationship("InfoOrganization", back_populates="events")
    time_slots = relationship("TimesEvent", back_populates="event", cascade="all, delete-orphan")
    group_links = relationship("EventGroupsEvent", back_populates="event", cascade="all, delete-orphan")
    liked_by_users = relationship("UserToEvent", back_populates="event", cascade="all, delete-orphan")


class TimesEvent(Base):
    __tablename__ = "times_event"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    event_id: int = Column(Integer, ForeignKey("events.id"), nullable=False)
    date_event: datetime = Column(DateTime(timezone=False), nullable=False)
    start_time: time = Column(TIME(timezone=False), nullable=False)

    event = relationship("Events", back_populates="time_slots")


class News(Base):
    __tablename__ = "news"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC, nullable=False)
    update_at: datetime = Column(
        TIMESTAMP(timezone=False),
        server_default=NOW_AT_UTC,
        onupdate=NOW_AT_UTC,
        nullable=False,
    )
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    name: str = Column(String, nullable=False)
    address: str = Column(String, nullable=True)
    organizator: str = Column(String, nullable=True)


class UserToEvent(Base):
    __tablename__ = "user_to_event"

    user_id: int = Column(Integer, ForeignKey("users.id"), primary_key=True)
    event_id: int = Column(Integer, ForeignKey("events.id"), primary_key=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC, nullable=False)
    update_at: datetime = Column(
        TIMESTAMP(timezone=False),
        server_default=NOW_AT_UTC,
        onupdate=NOW_AT_UTC,
        nullable=False,
    )
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)

    user = relationship("User", back_populates="liked_events")
    event = relationship("Events", back_populates="liked_by_users")


class UserGroupsEvent(Base):
    __tablename__ = "user_groups_event"

    user_id: int = Column(Integer, ForeignKey("users.id"), primary_key=True)
    groups_id: int = Column(Integer, ForeignKey("groups_event.id"), primary_key=True)

    user = relationship("User", back_populates="preferred_groups")
    group = relationship("GroupsEvent", back_populates="user_links")


class EventGroupsEvent(Base):
    __tablename__ = "event_groups_event"

    event_id: int = Column(Integer, ForeignKey("events.id"), primary_key=True)
    groups_id: int = Column(Integer, ForeignKey("groups_event.id"), primary_key=True)

    event = relationship("Events", back_populates="group_links")
    group = relationship("GroupsEvent", back_populates="event_links")


class ParsedEvent(Base):
    __tablename__ = "parsed_event"
    __table_args__ = (
        UniqueConstraint(
            "source_key",
            "name",
            "date_event",
            "start_time",
            name="parsed_event_source_name_date_start_time_key",
        ),
    )

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC, nullable=False)
    update_at: datetime = Column(
        TIMESTAMP(timezone=False),
        server_default=NOW_AT_UTC,
        onupdate=NOW_AT_UTC,
        nullable=False,
    )
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    source_key: str = Column(String, nullable=False)
    source_name: str = Column(String, nullable=False)
    name: str = Column(String, nullable=False)
    description: str = Column(String, nullable=True)
    date_event: str = Column(String, nullable=True)
    start_time: str = Column(String, nullable=True)
    duration: str = Column(String, nullable=True)
    city: str = Column(String, nullable=True)
    price: str = Column(String, nullable=True)
    address: str = Column(String, nullable=True)
    organization: str = Column(String, nullable=True)
    age_limit: str = Column(String, nullable=True)
    external_url: str = Column(String, nullable=True)
    pictures_main: str = Column(String, nullable=True)
    pictures_two: str = Column(String, nullable=True)
    target_type: ParsedTargetType = Column(
        Enum(ParsedTargetType, name="parsed_target_type_enum"),
        nullable=False,
        server_default=ParsedTargetType.unknown.value,
    )
    process_status: ParsedProcessStatus = Column(
        Enum(ParsedProcessStatus, name="parsed_process_status_enum"),
        nullable=False,
        server_default=ParsedProcessStatus.new.value,
    )
    processed_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    error_text: str = Column(Text, nullable=True)


# Backward-compatible alias
InfoOrg = InfoOrganization
