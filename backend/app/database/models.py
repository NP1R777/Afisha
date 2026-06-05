from sqlalchemy.schema import MetaData
from datetime import datetime, date, time
from sqlalchemy import DATE, ARRAY, ForeignKey
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import (Integer, Boolean, String, VARCHAR,
                        TIMESTAMP, text, Column, TIME, UniqueConstraint)


convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}

NOW_AT_UTC = text("timezone('utc', now())")

class Base(DeclarativeBase):
    pass

metadata = MetaData(naming_convention=convention)


class User(Base):
    __tablename__ = "user"
    id: int = Column(Integer, primary_key=True, autoincrement=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC,
                                                 nullable=True, autoincrement=True)
    update_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC,
                                                nullable=True, onupdate=NOW_AT_UTC, autoincrement=True)
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    username: str = Column(String, nullable=False, unique=True)
    password_hash: str = Column(String, nullable=False)
    preferences: list = Column(ARRAY(Integer), nullable=True) # Предпочтения пользователей по категориям.
    refresh_token: str = Column(String, nullable=True)
    email: str = Column(String, nullable=True)
    date_of_birth: str = Column(String, nullable=True)
    like_events: list = Column(ARRAY(Integer), default=list) # id мероприятий в избранном.


class Events(Base):
    __tablename__ = "event"
    id: int = Column(Integer, primary_key=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC,
                                            nullable=True, autoincrement=True)
    update_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC,
                                            nullable=True, autoincrement=True)
    deleted_at: datetime = Column(TIMESTAMP, nullable=True)
    name: str = Column(String, nullable=False)
    description: str = Column(String)
    city: str = Column(String, nullable=True)
    price: int = Column(Integer, nullable=True)
    address: str = Column(String, nullable=True)
    organization: str = Column(String, nullable=True)
    age_limit: str = Column(String, nullable=True)
    main_picture_url: str = Column(String, nullable=True)
    second_picture_url: str = Column(String, nullable=True)
    horizontal_picture_url: str = Column(String, nullable=True)
    event_external_url: str = Column(String, nullable=True)

    #group_id: int = Column(Integer, ForeignKey("group_event.id"), nullable=True) # Связь для получения категории мероприятия.
    #times_event_id: int = Column(Integer, ForeignKey("times_event.id"), nullable=True) # Связь для получения даты и времени мероприятия.


class GroupsEvent(Base):
    __tablename__ = "group_event"
    id: int = Column(Integer, primary_key=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC,
                                            nullable=True, autoincrement=True)
    update_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC,
                                            nullable=True, autoincrement=True)
    deleted_at: datetime = Column(TIMESTAMP, nullable=True)
    name: str = Column(VARCHAR, nullable=False)
    description: str = Column(VARCHAR, nullable=True)
    list_events: list = Column(ARRAY(Integer), default=list)


class UserToEvent(Base):
    __tablename__ = "user_to_event"
    id: int = Column(Integer, primary_key=True)
    created_at: datetime = Column(TIMESTAMP, nullable=False, autoincrement=True)
    update_at: datetime = Column(TIMESTAMP, nullable=False, autoincrement=True)
    deleted_at: datetime = Column(TIMESTAMP)

    user_id: int = Column(Integer, ForeignKey("user.id"), nullable=True)
    event_id: int = Column(Integer, ForeignKey("event.id"), nullable=True)


class InfoOrganization(Base):
    __tablename__ = "info_organization"
    id: int = Column(Integer, ForeignKey("event.organization"), primary_key=True)
    created_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC,
                                                 nullable=True, autoincrement=True)
    update_at: datetime = Column(TIMESTAMP(timezone=False), server_default=NOW_AT_UTC,
                                                nullable=True, onupdate=NOW_AT_UTC, autoincrement=True)
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    name_org: str = Column(String, nullable=True)
    address: str = Column(String, nullable=True)
    list_events_org: list = Column(ARRAY(Integer), default=list)
    list_news: list = Column(ARRAY(Integer), default=list)



class ParsedEvent(Base):
    __tablename__ = "parsed_event"
    __table_args__ = (
        UniqueConstraint("name", "date_event", name="parsed_event_name_date_key"),
    )

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    created_at: datetime = Column(
        TIMESTAMP(timezone=False),
        server_default=NOW_AT_UTC,
        nullable=True,
        autoincrement=True,
    )
    update_at: datetime = Column(
        TIMESTAMP(timezone=False),
        server_default=NOW_AT_UTC,
        nullable=True,
        onupdate=NOW_AT_UTC,
        autoincrement=True,
    )
    deleted_at: datetime = Column(TIMESTAMP(timezone=False), nullable=True)
    source_key: str = Column(String, nullable=False)
    source_name: str = Column(String, nullable=False)
    name: str = Column(VARCHAR, nullable=False)
    description: str = Column(VARCHAR, nullable=True)
    date_event: str = Column(String, nullable=True)
    duration: str = Column(String, nullable=True)
    city: str = Column(String, nullable=True)
    price: str = Column(String, nullable=True)
    address: str = Column(String, nullable=True)
    organization: str = Column(String, nullable=True)
    age_limit: str = Column(String, nullable=True)
    external_url: str = Column(String, nullable=True)
