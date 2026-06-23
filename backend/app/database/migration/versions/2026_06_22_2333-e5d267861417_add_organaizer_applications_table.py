"""add organizer_applications table

Revision ID: e5d267861417
Revises: e4f8a9b0c2d1
Create Date: 2026-06-22 23:33:35.311818

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import enum

# revision identifiers, used by Alembic.
revision = 'xxxxxxxxxxxx'   # Alembic сам подставит
down_revision = 'e4f8a9b0c2d1'  # ← ВАЖНО: укажи правильный предыдущий revision
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Создаём таблицу
    op.create_table('organizer_applications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(), server_default=sa.text("timezone('utc', now())"), nullable=False),
        sa.Column('deleted_at', postgresql.TIMESTAMP(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', name='application_status'), 
                  server_default='pending', nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('review_comment', sa.Text(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', postgresql.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], name='organizer_applications_reviewed_by_fkey'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='organizer_applications_user_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='organizer_applications_pkey'),
        sa.UniqueConstraint('user_id', name='organizer_applications_user_id_key')
    )

def downgrade() -> None:
    op.drop_table('organizer_applications')
    op.execute(sa.DDL("DROP TYPE IF EXISTS application_status"))