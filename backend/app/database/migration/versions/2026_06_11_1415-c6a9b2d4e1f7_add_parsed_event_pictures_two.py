"""Add pictures_two column to parsed_event

Revision ID: c6a9b2d4e1f7
Revises: b2f9d4c1a7e3
Create Date: 2026-06-11 14:15:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c6a9b2d4e1f7"
down_revision: Union[str, None] = "b2f9d4c1a7e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("parsed_event", sa.Column("pictures_two", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("parsed_event", "pictures_two")
