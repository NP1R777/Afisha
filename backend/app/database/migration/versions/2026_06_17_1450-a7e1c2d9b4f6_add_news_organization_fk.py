"""Add organization FK to news and backfill by organizator name

Revision ID: a7e1c2d9b4f6
Revises: 9f2d3b1c4a8e
Create Date: 2026-06-17 14:50:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a7e1c2d9b4f6"
down_revision: Union[str, None] = "9f2d3b1c4a8e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("news", sa.Column("organization", sa.Integer(), nullable=True))
    op.create_foreign_key(
        op.f("news_organization_fkey"),
        "news",
        "info_organization",
        ["organization"],
        ["id"],
    )

    # Backfill existing news by matching the free-text `organizator` field
    # against `info_organization.name_org`. Rows without a match are left NULL
    # (variant B): we intentionally do not create new organizations here.
    op.execute(
        """
        UPDATE news
        SET organization = io.id
        FROM info_organization io
        WHERE news.organization IS NULL
          AND news.organizator IS NOT NULL
          AND io.deleted_at IS NULL
          AND lower(btrim(news.organizator)) = lower(btrim(io.name_org))
        """
    )


def downgrade() -> None:
    op.drop_constraint(op.f("news_organization_fkey"), "news", type_="foreignkey")
    op.drop_column("news", "organization")
