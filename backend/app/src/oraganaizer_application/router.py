from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import User
from core.session import get_db
from src.dependencies.autentification import get_current_user, get_current_admin_user
from .schemas import OrganizerApplicationCreate, OrganizerApplicationOut, ApplicationReview
from .service import (
    create_organizer_application,
    get_pending_applications,
    approve_application,
    reject_application
)

router = APIRouter(prefix="/organizer-application", tags=["Organizer Applications"])


@router.post("/register-organizer", response_model=dict)
async def register_organizer(
    data: OrganizerApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await create_organizer_application(db, current_user.id, data.message)
    return {
        "message": "Заявка на регистрацию организатора принята к рассмотрению. После одобрения администратором у вас появятся права организатора."
    }


@router.get("/admin/applications", response_model=list[OrganizerApplicationOut])
async def admin_get_applications(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_pending_applications(db)


@router.post("/admin/applications/{application_id}/approve")
async def admin_approve_application(
    application_id: int,
    data: ApplicationReview,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    await approve_application(db, application_id, current_user.id, data.review_comment)
    return {"message": "Заявка одобрена. Пользователь получил права организатора."}


@router.post("/admin/applications/{application_id}/reject")
async def admin_reject_application(
    application_id: int,
    data: ApplicationReview,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    await reject_application(db, application_id, current_user.id, data.review_comment)
    return {"message": "Заявка отклонена."}