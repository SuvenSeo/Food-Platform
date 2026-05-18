"""Add alert_subscriptions table for price watch signups.

Revision ID: 0004_alert_subscriptions
Revises: 0003_add_image_url
Create Date: 2026-05-18 12:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_alert_subscriptions"
down_revision = "0003_add_image_url"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "alert_subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("scope", sa.String(length=32), nullable=False),
        sa.Column("scope_value", sa.String(length=128), nullable=True),
        sa.Column("cadence", sa.String(length=16), nullable=False, server_default="weekly"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("confirmed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("unsubscribe_token", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alert_subscriptions_email", "alert_subscriptions", ["email"])
    op.create_index("ix_alert_subscriptions_scope", "alert_subscriptions", ["scope"])
    op.create_index("ix_alert_subscriptions_active", "alert_subscriptions", ["active"])
    op.create_index("ix_alert_subscriptions_created_at", "alert_subscriptions", ["created_at"])
    op.create_index(
        "ix_alert_subscriptions_unsubscribe_token",
        "alert_subscriptions",
        ["unsubscribe_token"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_alert_subscriptions_unsubscribe_token", table_name="alert_subscriptions")
    op.drop_index("ix_alert_subscriptions_created_at", table_name="alert_subscriptions")
    op.drop_index("ix_alert_subscriptions_active", table_name="alert_subscriptions")
    op.drop_index("ix_alert_subscriptions_scope", table_name="alert_subscriptions")
    op.drop_index("ix_alert_subscriptions_email", table_name="alert_subscriptions")
    op.drop_table("alert_subscriptions")
