"""Add market quotes table.

Revision ID: 0002_market_quotes
Revises: 0001_initial_schema
Create Date: 2026-05-11 22:15:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_market_quotes"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "market_quotes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("district", sa.String(length=128), nullable=False),
        sa.Column("market_name", sa.String(length=255), nullable=False),
        sa.Column("item_name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=False),
        sa.Column("unit", sa.String(length=32), nullable=False, server_default="kg"),
        sa.Column("price_lkr", sa.Numeric(12, 2), nullable=False),
        sa.Column("source", sa.String(length=128), nullable=False),
        sa.Column("quoted_at", sa.DateTime(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_market_quotes_category", "market_quotes", ["category"])
    op.create_index("ix_market_quotes_district", "market_quotes", ["district"])
    op.create_index("ix_market_quotes_item_name", "market_quotes", ["item_name"])
    op.create_index("ix_market_quotes_market_name", "market_quotes", ["market_name"])
    op.create_index("ix_market_quotes_price_lkr", "market_quotes", ["price_lkr"])
    op.create_index("ix_market_quotes_quoted_at", "market_quotes", ["quoted_at"])
    op.create_index("ix_market_quotes_source", "market_quotes", ["source"])


def downgrade() -> None:
    op.drop_index("ix_market_quotes_source", table_name="market_quotes")
    op.drop_index("ix_market_quotes_quoted_at", table_name="market_quotes")
    op.drop_index("ix_market_quotes_price_lkr", table_name="market_quotes")
    op.drop_index("ix_market_quotes_market_name", table_name="market_quotes")
    op.drop_index("ix_market_quotes_item_name", table_name="market_quotes")
    op.drop_index("ix_market_quotes_district", table_name="market_quotes")
    op.drop_index("ix_market_quotes_category", table_name="market_quotes")
    op.drop_table("market_quotes")
