from fastapi import APIRouter
from src.user.router import router as users_router
from src.event.router import router as event_router
from src.group_event.router import router as group_event_router

api_router = APIRouter()

api_router.include_router(users_router, tags=["user"])
api_router.include_router(event_router, tags=["event"])
api_router.include_router(group_event_router, tags=["group"])
