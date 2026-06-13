"""Add start_time to parsed_event and update uniqueness

Revision ID: 9f2d3b1c4a8e
Revises: c6a9b2d4e1f7
Create Date: 2026-06-13 08:17:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9f2d3b1c4a8e"
down_revision: Union[str, None] = "c6a9b2d4e1f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("parsed_event", sa.Column("start_time", sa.String(), nullable=True))
    op.drop_constraint("parsed_event_name_date_key", "parsed_event", type_="unique")
    op.create_unique_constraint(
        "parsed_event_source_name_date_start_time_key",
        "parsed_event",
        ["source_key", "name", "date_event", "start_time"],
    )


def downgrade() -> None:
    op.drop_constraint("parsed_event_source_name_date_start_time_key", "parsed_event", type_="unique")
    op.create_unique_constraint(
        "parsed_event_name_date_key",
        "parsed_event",
        ["name", "date_event"],
    )
    op.drop_column("parsed_event", "start_time")
