"""Add pictures_main column to parsed_event

Revision ID: b2f9d4c1a7e3
Revises: f3c8e4b6a901
Create Date: 2026-06-07 06:58:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2f9d4c1a7e3"
down_revision: Union[str, None] = "f3c8e4b6a901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("parsed_event", sa.Column("pictures_main", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("parsed_event", "pictures_main")
