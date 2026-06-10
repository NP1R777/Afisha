"""Normalize core models and add relations

Revision ID: f3c8e4b6a901
Revises: 8d8a6ca01dd4
Create Date: 2026-06-05 14:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f3c8e4b6a901"
down_revision: Union[str, None] = "8d8a6ca01dd4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    role_enum_ref = postgresql.ENUM(
        "user",
        "admin",
        "organizator",
        name="role_enum",
        create_type=False,
    )
    city_enum_ref = postgresql.ENUM(
        "norilsk",
        "talnah",
        "kayerkan",
        "oganeer",
        "dudinka",
        name="city_enum",
        create_type=False,
    )
    parsed_target_type_enum_ref = postgresql.ENUM(
        "event",
        "news",
        "unknown",
        name="parsed_target_type_enum",
        create_type=False,
    )
    parsed_process_status_enum_ref = postgresql.ENUM(
        "new",
        "processed",
        "rejected",
        "error",
        name="parsed_process_status_enum",
        create_type=False,
    )

    op.execute(
        "DO $$ BEGIN "
        "CREATE TYPE role_enum AS ENUM ('user', 'admin', 'organizator'); "
        "EXCEPTION WHEN duplicate_object THEN null; END $$;"
    )
    op.execute(
        "DO $$ BEGIN "
        "CREATE TYPE city_enum AS ENUM ('norilsk', 'talnah', 'kayerkan', 'oganeer', 'dudinka'); "
        "EXCEPTION WHEN duplicate_object THEN null; END $$;"
    )
    op.execute(
        "DO $$ BEGIN "
        "CREATE TYPE parsed_target_type_enum AS ENUM ('event', 'news', 'unknown'); "
        "EXCEPTION WHEN duplicate_object THEN null; END $$;"
    )
    op.execute(
        "DO $$ BEGIN "
        "CREATE TYPE parsed_process_status_enum AS ENUM ('new', 'processed', 'rejected', 'error'); "
        "EXCEPTION WHEN duplicate_object THEN null; END $$;"
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column(
            "update_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=False), nullable=True),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("date_of_birth", sa.DATE(), nullable=False),
        sa.Column("refresh_token", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("users_pkey")),
        sa.UniqueConstraint("username", name=op.f("users_username_key")),
        sa.UniqueConstraint("email", name=op.f("users_email_key")),
    )

    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column(
            "update_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=False), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", role_enum_ref, server_default="user", nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("roles_user_id_fkey")),
        sa.PrimaryKeyConstraint("id", name=op.f("roles_pkey")),
        sa.UniqueConstraint("user_id", name=op.f("roles_user_id_key")),
    )

    op.create_table(
        "groups_event",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column(
            "update_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=False), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("groups_event_pkey")),
        sa.UniqueConstraint("name", name=op.f("groups_event_name_key")),
    )

    op.create_table(
        "info_organization",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column(
            "update_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=False), nullable=True),
        sa.Column("name_org", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("organizator", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("info_organization_pkey")),
    )

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column(
            "update_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=False), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("organization", sa.Integer(), nullable=True),
        sa.Column("city", city_enum_ref, nullable=True),
        sa.Column("price", sa.Float(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("age_limit", sa.String(), nullable=True),
        sa.Column("pictures_main", sa.String(), nullable=True),
        sa.Column("pictures_two", sa.String(), nullable=True),
        sa.Column("external_url", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["organization"], ["info_organization.id"], name=op.f("events_organization_fkey")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("events_pkey")),
    )

    op.create_table(
        "times_event",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("date_event", sa.DateTime(timezone=False), nullable=False),
        sa.Column("start_time", sa.TIME(timezone=False), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], name=op.f("times_event_event_id_fkey")),
        sa.PrimaryKeyConstraint("id", name=op.f("times_event_pkey")),
    )

    op.create_table(
        "news",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column(
            "update_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=False), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("organizator", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("news_pkey")),
    )

    # Legacy schemas may already contain old link tables with the same names.
    # Recreate them in normalized form to avoid DuplicateTable errors.
    op.execute("DROP TABLE IF EXISTS event_groups_event CASCADE")
    op.execute("DROP TABLE IF EXISTS user_groups_event CASCADE")
    op.execute("DROP TABLE IF EXISTS user_to_event CASCADE")

    op.create_table(
        "user_to_event",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column(
            "update_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("timezone('utc', now())"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=False), nullable=True),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], name=op.f("user_to_event_event_id_fkey")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("user_to_event_user_id_fkey")),
        sa.PrimaryKeyConstraint("user_id", "event_id", name=op.f("user_to_event_pkey")),
    )

    op.create_table(
        "user_groups_event",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("groups_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["groups_id"], ["groups_event.id"], name=op.f("user_groups_event_groups_id_fkey")
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("user_groups_event_user_id_fkey")),
        sa.PrimaryKeyConstraint("user_id", "groups_id", name=op.f("user_groups_event_pkey")),
    )

    op.create_table(
        "event_groups_event",
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("groups_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["event_id"], ["events.id"], name=op.f("event_groups_event_event_id_fkey")
        ),
        sa.ForeignKeyConstraint(
            ["groups_id"], ["groups_event.id"], name=op.f("event_groups_event_groups_id_fkey")
        ),
        sa.PrimaryKeyConstraint("event_id", "groups_id", name=op.f("event_groups_event_pkey")),
    )

    op.add_column(
        "parsed_event",
        sa.Column("target_type", parsed_target_type_enum_ref, server_default="unknown", nullable=False),
    )
    op.add_column(
        "parsed_event",
        sa.Column(
            "process_status",
            parsed_process_status_enum_ref,
            server_default="new",
            nullable=False,
        ),
    )
    op.add_column("parsed_event", sa.Column("processed_at", sa.TIMESTAMP(timezone=False), nullable=True))
    op.add_column("parsed_event", sa.Column("error_text", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("parsed_event", "error_text")
    op.drop_column("parsed_event", "processed_at")
    op.drop_column("parsed_event", "process_status")
    op.drop_column("parsed_event", "target_type")

    op.drop_table("event_groups_event")
    op.drop_table("user_groups_event")
    op.drop_table("user_to_event")
    op.drop_table("news")
    op.drop_table("times_event")
    op.drop_table("events")
    op.drop_table("info_organization")
    op.drop_table("groups_event")
    op.drop_table("roles")
    op.drop_table("users")

    bind = op.get_bind()
    sa.Enum(name="parsed_process_status_enum").drop(bind, checkfirst=True)
    sa.Enum(name="parsed_target_type_enum").drop(bind, checkfirst=True)
    sa.Enum(name="city_enum").drop(bind, checkfirst=True)
    sa.Enum(name="role_enum").drop(bind, checkfirst=True)
