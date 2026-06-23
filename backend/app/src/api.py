from fastapi import APIRouter
from src.user.router import router as users_router
from src.event.router import router as event_router
from src.group_event.router import router as group_event_router
from src.news.router import router as news_router
from src.parser.router import router as parser_router
from src.assistant.router import router as assistant_router
from src.organization.router import router as organization_router
from src.organizer_application.router import router as organization_application_router

api_router = APIRouter()

api_router.include_router(users_router, tags=["user"])
api_router.include_router(event_router, tags=["event"])
api_router.include_router(group_event_router, tags=["group"])
api_router.include_router(news_router, tags=["news"])
api_router.include_router(parser_router, tags=["parser"])
api_router.include_router(assistant_router, tags=["assistant"])
api_router.include_router(organization_router, tags=["organization"])
api_router.include_router(organization_application_router, tags=["organization_application"])