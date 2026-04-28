"""add parsed_event table

Revision ID: 2c3c886e1a75
Revises: 8fe970593fa3
Create Date: 2026-04-28 05:48:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2c3c886e1a75"
down_revision: Union[str, None] = "8fe970593fa3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "parsed_event",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("timezone('utc', now())"),
            autoincrement=True,
            nullable=True,
        ),
        sa.Column(
            "update_at",
            sa.TIMESTAMP(),
            server_default=sa.text("timezone('utc', now())"),
            autoincrement=True,
            nullable=True,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(), nullable=True),
        sa.Column("source_key", sa.String(), nullable=False),
        sa.Column("source_name", sa.String(), nullable=False),
        sa.Column("name", sa.VARCHAR(), nullable=False),
        sa.Column("description", sa.VARCHAR(), nullable=True),
        sa.Column("date_event", sa.String(), nullable=True),
        sa.Column("duration", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("price", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("organization", sa.String(), nullable=True),
        sa.Column("age_limit", sa.String(), nullable=True),
        sa.Column("external_url", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", "date_event", name="parsed_event_name_date_key"),
    )


def downgrade() -> None:
    op.drop_table("parsed_event")
