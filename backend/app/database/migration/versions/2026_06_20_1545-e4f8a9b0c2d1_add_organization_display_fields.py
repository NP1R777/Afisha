"""Add display fields to info_organization

Revision ID: e4f8a9b0c2d1
Revises: a7e1c2d9b4f6
Create Date: 2026-06-20 15:45:00.000000
"""

from pathlib import Path
from typing import Sequence, Union
import os

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e4f8a9b0c2d1"
down_revision: Union[str, None] = "a7e1c2d9b4f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DEFAULT_ORGANIZATION_DESCRIPTION = "Информация об организации отсутствует"

ORGANIZATION_URLS = {
    "заполярный театр драмы": "https://northdrama.ru",
    "городской центр культуры": "http://gcknorilsk.ru",
    "администрация города норильска": "https://xn--h1aecgfmj1g.xn--p1ai",
    "афиша северного города": "https://afisha.sgnorilsk.ru",
    "кинотеатр арт-холл": "https://cinemaarthall.ru",
    "кинотеатр родина": "https://кино-родина.рф",
    "трц арена-норильск": "https://арена-норильск.рф",
    "музей норильска": "https://vmuzey.com",
    "художественная галерея": "https://vmuzey.com",
    "талнахский филиал музея норильска": "https://vmuzey.com",
    "норильский колледж искусств": "https://vk.ru",
    "талнахская детская школа искусств": "https://talnah-dshi.ru",
    "норильская детская школа искусств": "https://nordshi.ru",
}


def _read_default_event_detail_image_url() -> str | None:
    value = (os.environ.get("DEFAULT_EVENT_DETAIL_IMAGE_URL") or "").strip()
    if value:
        return value

    env_path = Path(__file__).resolve().parents[4] / ".env"
    if not env_path.exists():
        return None

    for line in env_path.read_text(encoding="utf-8").splitlines():
        cleaned = line.strip()
        if not cleaned or cleaned.startswith("#") or "=" not in cleaned:
            continue
        key, raw_value = cleaned.split("=", 1)
        if key.strip() != "DEFAULT_EVENT_DETAIL_IMAGE_URL":
            continue
        return raw_value.strip().strip('"').strip("'") or None
    return None


def upgrade() -> None:
    op.add_column("info_organization", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("info_organization", sa.Column("picture_org", sa.String(), nullable=True))
    op.add_column("info_organization", sa.Column("external_url", sa.Text(), nullable=True))

    op.execute(
        sa.text(
            """
            UPDATE info_organization
            SET description = :description
            WHERE description IS NULL OR btrim(description) = ''
            """
        ).bindparams(description=DEFAULT_ORGANIZATION_DESCRIPTION)
    )

    for organization_name, external_url in ORGANIZATION_URLS.items():
        op.execute(
            sa.text(
                """
                UPDATE info_organization
                SET external_url = :external_url
                WHERE external_url IS NULL
                  AND lower(btrim(name_org)) = :organization_name
                """
            ).bindparams(
                external_url=external_url,
                organization_name=organization_name,
            )
        )

    default_picture = _read_default_event_detail_image_url()
    if default_picture:
        op.execute(
            sa.text(
                """
                UPDATE info_organization
                SET picture_org = :picture_org
                WHERE picture_org IS NULL OR btrim(picture_org) = ''
                """
            ).bindparams(picture_org=default_picture)
        )


def downgrade() -> None:
    op.drop_column("info_organization", "external_url")
    op.drop_column("info_organization", "picture_org")
    op.drop_column("info_organization", "description")
