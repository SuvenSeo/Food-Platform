"""Initial food intelligence schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-11 21:35:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "scrape_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="running"),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("items_seen", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("items_stored", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
    )
    op.create_index("ix_scrape_runs_source", "scrape_runs", ["source"])

    op.create_table(
        "raw_offers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("scrape_run_id", sa.Integer(), sa.ForeignKey("scrape_runs.id"), nullable=True),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("source_item_id", sa.String(length=128), nullable=False),
        sa.Column("source_group_id", sa.String(length=128), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("variant_title", sa.String(length=255), nullable=True),
        sa.Column("price_lkr", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="LKR"),
        sa.Column("available", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sku", sa.String(length=128), nullable=True),
        sa.Column("url", sa.String(length=1024), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("scraped_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_raw_offers_scrape_run_id", "raw_offers", ["scrape_run_id"])
    op.create_index("ix_raw_offers_source", "raw_offers", ["source"])
    op.create_index("ix_raw_offers_source_group_id", "raw_offers", ["source_group_id"])
    op.create_index("ix_raw_offers_source_item_id", "raw_offers", ["source_item_id"])
    op.create_index("ix_raw_offers_scraped_at", "raw_offers", ["scraped_at"])

    op.create_table(
        "food_offers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("raw_offer_id", sa.Integer(), sa.ForeignKey("raw_offers.id"), nullable=True, unique=True),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("source_item_id", sa.String(length=128), nullable=False),
        sa.Column("source_group_id", sa.String(length=128), nullable=False),
        sa.Column("category", sa.String(length=128), nullable=False),
        sa.Column("brand", sa.String(length=128), nullable=True),
        sa.Column("canonical_name", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("unit", sa.String(length=32), nullable=True),
        sa.Column("unit_amount", sa.Float(), nullable=True),
        sa.Column("pack_descriptor", sa.String(length=255), nullable=True),
        sa.Column("price_lkr", sa.Numeric(12, 2), nullable=False),
        sa.Column("price_per_unit_lkr", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="LKR"),
        sa.Column("available", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sku", sa.String(length=128), nullable=True),
        sa.Column("url", sa.String(length=1024), nullable=False),
        sa.Column("district", sa.String(length=128), nullable=True),
        sa.Column("city", sa.String(length=128), nullable=True),
        sa.Column("cluster_key", sa.String(length=255), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_food_offers_available", "food_offers", ["available"])
    op.create_index("ix_food_offers_brand", "food_offers", ["brand"])
    op.create_index("ix_food_offers_category", "food_offers", ["category"])
    op.create_index("ix_food_offers_canonical_name", "food_offers", ["canonical_name"])
    op.create_index("ix_food_offers_city", "food_offers", ["city"])
    op.create_index("ix_food_offers_cluster_key", "food_offers", ["cluster_key"])
    op.create_index("ix_food_offers_district", "food_offers", ["district"])
    op.create_index("ix_food_offers_last_seen_at", "food_offers", ["last_seen_at"])
    op.create_index("ix_food_offers_price_lkr", "food_offers", ["price_lkr"])
    op.create_index("ix_food_offers_source", "food_offers", ["source"])
    op.create_index("ix_food_offers_source_group_id", "food_offers", ["source_group_id"])
    op.create_index("ix_food_offers_source_item_id", "food_offers", ["source_item_id"])

    op.create_table(
        "price_aggregates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cluster_key", sa.String(length=255), nullable=False),
        sa.Column("canonical_name", sa.String(length=255), nullable=False),
        sa.Column("brand", sa.String(length=128), nullable=True),
        sa.Column("category", sa.String(length=128), nullable=False),
        sa.Column("unit", sa.String(length=32), nullable=True),
        sa.Column("unit_amount", sa.Float(), nullable=True),
        sa.Column("offers_count", sa.Integer(), nullable=False),
        sa.Column("min_price_lkr", sa.Numeric(12, 2), nullable=False),
        sa.Column("max_price_lkr", sa.Numeric(12, 2), nullable=False),
        sa.Column("median_price_lkr", sa.Numeric(12, 2), nullable=False),
        sa.Column("average_price_lkr", sa.Numeric(12, 2), nullable=False),
        sa.Column("calculated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_price_aggregates_brand", "price_aggregates", ["brand"])
    op.create_index("ix_price_aggregates_calculated_at", "price_aggregates", ["calculated_at"])
    op.create_index("ix_price_aggregates_canonical_name", "price_aggregates", ["canonical_name"])
    op.create_index("ix_price_aggregates_category", "price_aggregates", ["category"])
    op.create_index("ix_price_aggregates_cluster_key", "price_aggregates", ["cluster_key"])

    op.create_table(
        "fair_price_scores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("food_offer_id", sa.Integer(), sa.ForeignKey("food_offers.id"), nullable=False),
        sa.Column("source_item_id", sa.String(length=128), nullable=False),
        sa.Column("cluster_key", sa.String(length=255), nullable=False),
        sa.Column("median_price_lkr", sa.Numeric(12, 2), nullable=False),
        sa.Column("delta_vs_median_pct", sa.Float(), nullable=False),
        sa.Column("price_band", sa.String(length=32), nullable=False),
        sa.Column("calculated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_fair_price_scores_calculated_at", "fair_price_scores", ["calculated_at"])
    op.create_index("ix_fair_price_scores_cluster_key", "fair_price_scores", ["cluster_key"])
    op.create_index("ix_fair_price_scores_food_offer_id", "fair_price_scores", ["food_offer_id"])
    op.create_index("ix_fair_price_scores_price_band", "fair_price_scores", ["price_band"])
    op.create_index("ix_fair_price_scores_source_item_id", "fair_price_scores", ["source_item_id"])


def downgrade() -> None:
    op.drop_index("ix_fair_price_scores_source_item_id", table_name="fair_price_scores")
    op.drop_index("ix_fair_price_scores_price_band", table_name="fair_price_scores")
    op.drop_index("ix_fair_price_scores_food_offer_id", table_name="fair_price_scores")
    op.drop_index("ix_fair_price_scores_cluster_key", table_name="fair_price_scores")
    op.drop_index("ix_fair_price_scores_calculated_at", table_name="fair_price_scores")
    op.drop_table("fair_price_scores")

    op.drop_index("ix_price_aggregates_cluster_key", table_name="price_aggregates")
    op.drop_index("ix_price_aggregates_category", table_name="price_aggregates")
    op.drop_index("ix_price_aggregates_canonical_name", table_name="price_aggregates")
    op.drop_index("ix_price_aggregates_calculated_at", table_name="price_aggregates")
    op.drop_index("ix_price_aggregates_brand", table_name="price_aggregates")
    op.drop_table("price_aggregates")

    op.drop_index("ix_food_offers_source_item_id", table_name="food_offers")
    op.drop_index("ix_food_offers_source_group_id", table_name="food_offers")
    op.drop_index("ix_food_offers_source", table_name="food_offers")
    op.drop_index("ix_food_offers_price_lkr", table_name="food_offers")
    op.drop_index("ix_food_offers_last_seen_at", table_name="food_offers")
    op.drop_index("ix_food_offers_district", table_name="food_offers")
    op.drop_index("ix_food_offers_cluster_key", table_name="food_offers")
    op.drop_index("ix_food_offers_city", table_name="food_offers")
    op.drop_index("ix_food_offers_canonical_name", table_name="food_offers")
    op.drop_index("ix_food_offers_category", table_name="food_offers")
    op.drop_index("ix_food_offers_brand", table_name="food_offers")
    op.drop_index("ix_food_offers_available", table_name="food_offers")
    op.drop_table("food_offers")

    op.drop_index("ix_raw_offers_scraped_at", table_name="raw_offers")
    op.drop_index("ix_raw_offers_source_item_id", table_name="raw_offers")
    op.drop_index("ix_raw_offers_source_group_id", table_name="raw_offers")
    op.drop_index("ix_raw_offers_source", table_name="raw_offers")
    op.drop_index("ix_raw_offers_scrape_run_id", table_name="raw_offers")
    op.drop_table("raw_offers")

    op.drop_index("ix_scrape_runs_source", table_name="scrape_runs")
    op.drop_table("scrape_runs")
