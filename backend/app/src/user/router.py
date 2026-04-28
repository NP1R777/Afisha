import hashlib
from datetime import datetime
from jose import jwt, JWTError
from database.models import User, Events
from sqlalchemy import and_, select
from core.settings import AppSettings
from core.session import get_db, get_settings
from sqlalchemy.ext.asyncio import AsyncSession
from src.user.auth import create_refresh_token, create_access_token
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from src.dependencies.autentification import get_token_payload, get_current_user
from src.user.schemas import (UserIn, UserOut, TokenResponse, UserUpdate,
                              UserUpdatePreferences, UserUpdateLikeEvents,
                              UserOutLikeEvents)


router = APIRouter()

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
    user_add = User(
        username=user_data["username"],
        password_hash=hashlib.sha256(user_data["password"].encode()).hexdigest(),
        email=user_data["email"],
        date_of_birth=user_data["date_of_birth"],
        preferences=user_data["preferences"],
    )
    db_connect.add(user_add)
    await db_connect.flush()
    await db_connect.refresh(user_add)
    user_add.refresh_token = create_refresh_token(user_add.id, settings=settings)
    return UserOut.Create(
        created_at=user_add.created_at,
        update_at=user_add.update_at,
        deleted_at=user_add.deleted_at,
        id=user_add.id,
        username=user_add.username,
        email=user_add.email,
        date_of_birth=user_add.date_of_birth,
        preferences=user_add.preferences,
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
        return HTTPException(status_code=404, detail="Пользователь с таким id не найден или уже удалён")
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
        if user_update.username != "string":
            user_data.username = user_update.username

        if user_update.password != "string":
            user_data.password_hash = hashlib.sha256(user_update.password.encode()).hexdigest()

        if user_update.email != "user@example.com":
            user_data.email = user_update.email

        if user_update.preferences != [0]:
            user_data.preferences = user_update.preferences

        if user_update.date_of_birth != "string":
            user_data.date_of_birth = user_update.date_of_birth

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
        return user_data


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
        user_data.preferences = user_update.preferences

        user_data.update_at = datetime.now()
        await db_connect.commit()
        await db_connect.refresh(user_data)

        return {"message": "Избранные категории успешно изменены!"}


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
        if user_data.like_events is None:
            user_data.like_events = []

        if event_id in user_data.like_events:
            raise HTTPException(status_code=409, detail="Такое мероприятие уже добавлено!")

        user_data.like_events = user_data.like_events + [event_id]

        db_connect.add(user_data)
        await db_connect.commit()
        await db_connect.refresh(user_data)

        return UserOutLikeEvents(like_events=user_data.like_events)


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
        like_events = []
        for event_id in user_data.like_events:
            event = ((await db_connect.execute(select(Events).filter(
                Events.id == event_id))).scalars().all())
            like_events.append(event)

        return like_events


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
        return users_data
