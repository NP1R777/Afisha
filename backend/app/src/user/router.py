import hashlib
from collections import defaultdict
from datetime import date, datetime
from jose import jwt, JWTError
from database.models import Events, RoleEnum, Roles, User, UserGroupsEvent, UserToEvent
from sqlalchemy import and_, delete, select
from core.settings import AppSettings
from core.session import get_db, get_settings
from sqlalchemy.ext.asyncio import AsyncSession
from src.user.auth import create_refresh_token, create_access_token
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from src.dependencies.autentification import get_token_payload, get_current_user
from src.user.schemas import (UserIn, UserOut, TokenResponse, UserUpdate,
                              UserUpdatePreferences, UserUpdateLikeEvents,
                              UserOutLikeEvents, UserUpdateRole, UserAdminOut)


router = APIRouter()


def _normalize_ids(raw_values: list[int] | None) -> list[int]:
    if not raw_values:
        return []
    return sorted(set(raw_values))


def _parse_birth_date(raw_value: str) -> date:
    return date.fromisoformat(raw_value)


async def _set_user_preferences(
    db_connect: AsyncSession,
    *,
    user_id: int,
    group_ids: list[int],
) -> None:
    normalized_group_ids = _normalize_ids(group_ids)
    await db_connect.execute(delete(UserGroupsEvent).where(UserGroupsEvent.user_id == user_id))
    for group_id in normalized_group_ids:
        db_connect.add(UserGroupsEvent(user_id=user_id, groups_id=group_id))


async def _get_user_preference_ids(db_connect: AsyncSession, user_id: int) -> list[int]:
    rows = (
        await db_connect.execute(
            select(UserGroupsEvent.groups_id).where(UserGroupsEvent.user_id == user_id)
        )
    ).scalars().all()
    return sorted(rows)


async def _get_user_liked_event_ids(db_connect: AsyncSession, user_id: int) -> list[int]:
    rows = (
        await db_connect.execute(
            select(UserToEvent.event_id).where(
                UserToEvent.user_id == user_id,
                UserToEvent.deleted_at.is_(None),
            )
        )
    ).scalars().all()
    return sorted(rows)


def _serialize_user_admin_payload(
    user: User,
    *,
    role: str | None,
    preferences: list[int],
) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "date_of_birth": str(user.date_of_birth) if user.date_of_birth else None,
        "role": role,
        "preferences": preferences,
        "created_at": user.created_at,
        "update_at": user.update_at,
        "deleted_at": user.deleted_at,
    }

@router.post(
    '/user/registration',
    response_model=UserOut.Create,
    description="Регистрация нового пользователя системы.",
    summary="Регистрация нового пользователя системы.",
    responses={
        200: {"description": "Пользователь создан"},
        500: {"description": "Ошибка создания пользователя"},
    }
)
async def register(
        user: UserIn.Create,
        db_connect: AsyncSession = Depends(get_db),
        settings: AppSettings = Depends(get_settings)
) -> UserIn.Create:
    user_data = user.dict()
    try:
        date_of_birth = _parse_birth_date(user_data["date_of_birth"])
    except ValueError:
        raise HTTPException(status_code=422, detail="date_of_birth должен быть в формате YYYY-MM-DD")

    user_add = User(
        username=user_data["username"],
        password_hash=hashlib.sha256(user_data["password"].encode()).hexdigest(),
        email=user_data["email"],
        date_of_birth=date_of_birth,
    )
    db_connect.add(user_add)
    await db_connect.flush()
    await db_connect.refresh(user_add)

    db_connect.add(Roles(user_id=user_add.id, role=RoleEnum.user))
    await _set_user_preferences(
        db_connect,
        user_id=user_add.id,
        group_ids=user_data.get("preferences", []),
    )

    user_add.refresh_token = create_refresh_token(user_add.id, settings=settings)
    return UserOut.Create(
        created_at=user_add.created_at,
        update_at=user_add.update_at,
        deleted_at=user_add.deleted_at,
        id=user_add.id,
        username=user_add.username,
        email=user_add.email,
        date_of_birth=str(user_add.date_of_birth),
        preferences=await _get_user_preference_ids(db_connect, user_add.id),
    )



@router.post(
    '/user/login',
    response_model=TokenResponse,
    description="Авторизация пользователя.",
    summary="Авторизация пользователя.",
    responses={
        200: {"description": "Успешная авторизация"},
        500: {
            "description": "Ошибка авторизации пользователя",
        },
        404: {
            "description": "Пользователя с таким номером не существует",
        },
        401: {
            "description": "Пользователь не верифицирован",
        },
    }
)
async def login(
        user_in: UserIn.Login,
        response: Response,
        db_connect: AsyncSession = Depends(get_db),
        settings: AppSettings = Depends(get_settings)
) -> TokenResponse:
    user_data = user_in.dict()
    password_hash = hashlib.sha256(user_data["password"].encode()).hexdigest()
    user = (
        await db_connect.execute(
            select(User).filter(
                and_(
                    User.password_hash == password_hash,
                    User.username == user_data["username"]
                )
            )
        )
    ).scalar()
    if not user:
        raise HTTPException(status_code=404, detail="Не найден пользователь")

    if user.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Пользователь удалён из базы")

    access_token = create_access_token(user.id, settings=settings)
    user.refresh_token = create_refresh_token(user.id, settings=settings)
    response.set_cookie(
        key="refresh_token",
        value=user.refresh_token,
        httponly=True,
        max_age=3600,
        secure=True,
        samesite="Lax"
    )

    if access_token:
        return TokenResponse(
            user_id=user.id,
            username=user.username,
            access_token=access_token,
            refresh_token=user.refresh_token,
            token_type='bearer'
        )


@router.get(
    "/user/me",
    dependencies=[Depends(get_token_payload)]
)
async def me(
        current_user: User = Depends(get_current_user)
):
    return UserOut.Me(
        created_at=current_user.created_at,
        update_at=current_user.update_at,
        deleted_at=current_user.deleted_at,
        id=current_user.id,
        password=current_user.password_hash,
        username=current_user.username,
        refresh_token=current_user.refresh_token,
    )


@router.post(
    "/user/refresh",
    description="Обновление токена доступа.",
    summary="Обновление токена доступа.",
    response_model=TokenResponse,
    responses={
        200: {"description": "Успешное обновление токена"},
        500: {"description": "Ошибка обновление токена"},
        401: {"description": "Невалидный refresh token"}
    }
)
async def refresh(
        refresh_token: str,
        request: Request,
        response: Response,
        db_connect: AsyncSession = Depends(get_db),
        settings: AppSettings = Depends(get_settings)
) -> TokenResponse:
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Невалидный refresh token")
    try:
        payload = jwt.decode(refresh_token, settings.jwt_key, algorithms=settings.jwt_algorithm)
        user = (await db_connect.execute(select(User).filter(User.id == payload.get("user_id")))).scalar()
        if not user:
            raise HTTPException(status_code=401, detail="Невалидный refresh token")
        new_access_token = create_access_token(user.id, settings=settings)
        new_refresh_token = create_refresh_token(user.id, settings=settings)
        user.refresh_token = new_refresh_token

        response.set_cookie(
            key="refresh_token",
            value=user.refresh_token,
            httponly=True,
            max_age=3600,
            secure=True,
            samesite="Lax"
        )

        return TokenResponse(
            user_id=user.id,
            username=user.username,
            access_token=new_access_token,
            refresh_token=user.refresh_token,
            token_type='bearer'
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Невалидный refresh token")


@router.delete(
    "/user/delete_user",
    description="Удаление пользователя из базы данных",
    summary="Удаление пользователей из базы данных",
    responses = {
        200: {"description": "Мероприятие успешно удалено"},
        500: {"description": "Мероприятие не было найдено"}
    }
)
async def delete_user(
        user_id: int,
        db_connect: AsyncSession = Depends(get_db),
):
    user_data: User = (await db_connect.execute(select(User).filter(User.id == user_id,
                                                                    User.deleted_at.is_(None)))).scalar()
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь с таким id не найден или уже удалён")
    else:
        user_data.deleted_at = datetime.now()
        return {"message": "Пользователь успешно удалён!"}


@router.patch(
    "/user/change_data",
    description="Изменение данных существующего пользователя",
    summary="Изменение данных существующего пользователя",
    responses={
        200: {"description": "Данные успешно изменены!"},
        500: {"description": "Данные изменить не удалось"}
    }
)
async def change_data(
        user_id: int,
        user_update: UserUpdate,
        db_connect: AsyncSession = Depends(get_db),
):
    user_data: User = (await db_connect.execute(select(User).filter(User.id == user_id))).scalar()
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь не найден!")
    elif user_data.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Пользователь удалён из базы")
    else:
        if user_update.username is not None:
            user_data.username = user_update.username

        if user_update.password is not None:
            user_data.password_hash = hashlib.sha256(user_update.password.encode()).hexdigest()

        if user_update.email is not None:
            user_data.email = user_update.email

        if user_update.preferences is not None:
            await _set_user_preferences(
                db_connect,
                user_id=user_id,
                group_ids=user_update.preferences,
            )

        if user_update.date_of_birth is not None:
            try:
                user_data.date_of_birth = _parse_birth_date(user_update.date_of_birth)
            except ValueError:
                raise HTTPException(
                    status_code=422,
                    detail="date_of_birth должен быть в формате YYYY-MM-DD",
                )

        user_data.update_at = datetime.now()

        await db_connect.commit()
        await db_connect.refresh(user_data)

        return {"message": "Данные пользователя успешно изменены!"}


@router.get(
    "/user/get_user",
    description="Получение пользователя из базы данных по id",
    summary="Получение пользователя из базы данных по id",
    responses={
        200: {"description": "Пользователь получен!"},
        500: {"description": "Не удалось получить пользователя"}
    }
)
async def get_user(user_id: int,
                   db_connect: AsyncSession = Depends(get_db)):
    user_data = (await db_connect.execute(select(User).filter(User.id == user_id))).scalar()
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователя нет в базе данных!")
    elif user_data.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Пользователь удалён из базы")
    else:
        role = (
            await db_connect.execute(
                select(Roles.role).where(
                    Roles.user_id == user_data.id,
                    Roles.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        return _serialize_user_admin_payload(
            user_data,
            role=role.value if role else None,
            preferences=await _get_user_preference_ids(db_connect, user_data.id),
        )


@router.patch(
    "/user/update_preferences",
    description="Изменение избранных категорий пользователя",
    summary="Изменение избранных категорий пользователя",
    responses={
        200: {"description": "Изменения прошли успешно!"},
        500: {"description": "Во время внесения изменений произошла ошибка!"}
    }
)
async def update_preferences(
        user_id: int,
        user_update: UserUpdatePreferences,
        db_connect: AsyncSession = Depends(get_db),
):
    user_data = (await db_connect.execute(select(User).filter(User.id == user_id))).scalar()
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь не был найден!")
    else:
        await _set_user_preferences(
            db_connect,
            user_id=user_id,
            group_ids=user_update.preferences or [],
        )
        user_data.update_at = datetime.now()
        await db_connect.commit()
        await db_connect.refresh(user_data)

        return {
            "message": "Избранные категории успешно изменены!",
            "preferences": await _get_user_preference_ids(db_connect, user_id),
        }


@router.patch(
    "/user/add_like_events",
    response_model=UserUpdateLikeEvents,
    description="Добавления мероприятия в избранные пользователя",
    summary="Добавление мероприятия в избранные пользователя",
    responses={
        200: {"description": "Мероприятие добавлено!"},
        500: {"desccription": "Во время добавления мероприятия произошла ошибка"}
    }
)
async def add_like_events(user_id: int,
                          event_id: int,
                          db_connect: AsyncSession = Depends(get_db)):
    user_data = (await db_connect.execute(select(User).filter(User.id == user_id))).scalar()

    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь не найден!")
    else:
        event = (await db_connect.execute(select(Events).filter(Events.id == event_id))).scalar()
        if not event:
            raise HTTPException(status_code=404, detail="Мероприятие не найдено!")

        existing = (
            await db_connect.execute(
                select(UserToEvent).where(
                    UserToEvent.user_id == user_id,
                    UserToEvent.event_id == event_id,
                    UserToEvent.deleted_at.is_(None),
                )
            )
        ).scalar_one_or_none()
        if existing:
            raise HTTPException(status_code=409, detail="Такое мероприятие уже добавлено!")

        db_connect.add(UserToEvent(user_id=user_id, event_id=event_id))
        await db_connect.commit()
        return UserOutLikeEvents(
            like_events=await _get_user_liked_event_ids(db_connect, user_id)
        )


@router.get(
    "/user/get_like_events",
    description="Получение избранных мероприятий пользователя",
    summary="Получение избранных мероприятий пользователя",
    responses={
        200: {"description": "Мероприятия успешно получены!"},
        500: {"description": "При получении мероприятий произошла ошибка"}
    }
)
async def get_like_events(user_id: int,
                          db_connect: AsyncSession = Depends(get_db)):
    user_data = (await db_connect.execute(select(User).filter(User.id == user_id))).scalar()
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь не найден в базе!")
    else:
        return (
            await db_connect.execute(
                select(Events)
                .join(UserToEvent, UserToEvent.event_id == Events.id)
                .where(
                    UserToEvent.user_id == user_id,
                    UserToEvent.deleted_at.is_(None),
                )
                .order_by(Events.id.desc())
            )
        ).scalars().all()


@router.get(
    "/user/all",
    description="Получение всех пользователей из базы данных",
    summary="Получение всех пользователей из базы данных",
    responses={
        200: {"description": "Пользователи успешно получены"},
        500: {"description": "При получении пользователей произошла ошибка"}
    }
)
async def get_all_user(db_connect: AsyncSession = Depends(get_db)):
    users_data = (await db_connect.execute(select(User))).scalars().all()
    if not users_data:
        raise HTTPException(status_code=404, detail='В базе данных нет пользователей!')
    else:
        user_ids = [item.id for item in users_data]

        role_rows = (
            await db_connect.execute(
                select(Roles.user_id, Roles.role).where(
                    Roles.user_id.in_(user_ids),
                    Roles.deleted_at.is_(None),
                )
            )
        ).all()
        role_map = {user_id: role.value for user_id, role in role_rows}

        preference_rows = (
            await db_connect.execute(
                select(UserGroupsEvent.user_id, UserGroupsEvent.groups_id).where(
                    UserGroupsEvent.user_id.in_(user_ids)
                )
            )
        ).all()
        preference_map: dict[int, list[int]] = defaultdict(list)
        for uid, group_id in preference_rows:
            preference_map[uid].append(group_id)

        return [
            UserAdminOut(
                **_serialize_user_admin_payload(
                    user,
                    role=role_map.get(user.id),
                    preferences=sorted(preference_map.get(user.id, [])),
                )
            )
            for user in users_data
        ]


@router.patch(
    "/user/change_role",
    description="Смена роли пользователя",
    summary="Смена роли пользователя",
    responses={
        200: {"description": "Роль пользователя успешно обновлена"},
        404: {"description": "Пользователь не найден"},
    },
)
async def change_user_role(
    user_id: int,
    payload: UserUpdateRole,
    db_connect: AsyncSession = Depends(get_db),
):
    user = (
        await db_connect.execute(
            select(User).where(
                User.id == user_id,
                User.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    role_row = (
        await db_connect.execute(
            select(Roles).where(
                Roles.user_id == user_id,
                Roles.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    next_role = RoleEnum(payload.role)
    if role_row is None:
        role_row = Roles(user_id=user_id, role=next_role)
        db_connect.add(role_row)
    else:
        role_row.role = next_role
        role_row.update_at = datetime.utcnow()

    user.update_at = datetime.utcnow()
    await db_connect.flush()
    return {"message": "Роль пользователя обновлена", "user_id": user_id, "role": next_role.value}
