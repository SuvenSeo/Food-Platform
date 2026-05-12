"""Add image_url to raw_offers and food_offers.

Revision ID: 0003_add_image_url
Revises: 0002_market_quotes
Create Date: 2026-05-12 08:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_add_image_url"
down_revision = "0002_market_quotes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("raw_offers", sa.Column("image_url", sa.String(length=1024), nullable=True))
    op.add_column("food_offers", sa.Column("image_url", sa.String(length=1024), nullable=True))


def downgrade() -> None:
    op.drop_column("food_offers", "image_url")
    op.drop_column("raw_offers", "image_url")
