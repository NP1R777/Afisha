from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from fastapi.exceptions import HTTPException

from database.models import OrganizerApplication, ApplicationStatus, User, Roles, RoleEnum
from .schemas import OrganizerApplicationOut


async def create_organizer_application(
    db: AsyncSession, 
    user_id: int, 
    message: Optional[str] = None
) -> OrganizerApplication:
    app = OrganizerApplication(
        user_id=user_id,
        message=message,
        status=ApplicationStatus.pending
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


async def get_pending_applications(db: AsyncSession):
    result = await db.execute(
        select(OrganizerApplication)
        .where(OrganizerApplication.status == ApplicationStatus.pending)
        .where(OrganizerApplication.deleted_at.is_(None))
        .order_by(OrganizerApplication.created_at.desc())
    )
    return result.scalars().all()


async def approve_application(
    db: AsyncSession, 
    application_id: int, 
    admin_id: int, 
    review_comment: Optional[str] = None
):
    app = await db.get(OrganizerApplication, application_id)
    if not app or app.status != ApplicationStatus.pending:
        raise HTTPException(status_code=404, detail="Заявка не найдена или уже обработана")

    app.status = ApplicationStatus.approved
    app.reviewed_by = admin_id
    app.reviewed_at = datetime.utcnow()
    app.review_comment = review_comment

    # Меняем роль пользователя на organizator
    role_stmt = select(Roles).where(Roles.user_id == app.user_id)
    role = (await db.execute(role_stmt)).scalar_one_or_none()
    if role:
        role.role = RoleEnum.organizator

    await db.commit()
    await db.refresh(app)
    return app


async def reject_application(
    db: AsyncSession, 
    application_id: int, 
    admin_id: int, 
    review_comment: Optional[str] = None
):
    app = await db.get(OrganizerApplication, application_id)
    if not app or app.status != ApplicationStatus.pending:
        raise HTTPException(status_code=404, detail="Заявка не найдена или уже обработана")

    app.status = ApplicationStatus.rejected
    app.reviewed_by = admin_id
    app.reviewed_at = datetime.utcnow()
    app.review_comment = review_comment

    await db.commit()
    await db.refresh(app)
    return app