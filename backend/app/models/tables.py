from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ScrapeRun(Base):
    __tablename__ = "scrape_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default="running")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    items_seen: Mapped[int] = mapped_column(Integer, default=0)
    items_stored: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    raw_offers: Mapped[list["RawOfferRecord"]] = relationship(back_populates="scrape_run")


class RawOfferRecord(Base):
    __tablename__ = "raw_offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scrape_run_id: Mapped[int | None] = mapped_column(ForeignKey("scrape_runs.id"), nullable=True, index=True)
    source: Mapped[str] = mapped_column(String(64), index=True)
    source_item_id: Mapped[str] = mapped_column(String(128), index=True)
    source_group_id: Mapped[str] = mapped_column(String(128), index=True)
    category: Mapped[str] = mapped_column(String(128), index=True)
    title: Mapped[str] = mapped_column(String(512))
    variant_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    price_lkr: Mapped[float] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(8), default="LKR")
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    sku: Mapped[str | None] = mapped_column(String(128), nullable=True)
    url: Mapped[str] = mapped_column(String(1024))
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    raw_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    scraped_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    scrape_run: Mapped[ScrapeRun | None] = relationship(back_populates="raw_offers")
    normalized_offer: Mapped["FoodOfferRecord | None"] = relationship(back_populates="raw_offer")


class FoodOfferRecord(Base):
    __tablename__ = "food_offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    raw_offer_id: Mapped[int | None] = mapped_column(ForeignKey("raw_offers.id"), nullable=True, unique=True)
    source: Mapped[str] = mapped_column(String(64), index=True)
    source_item_id: Mapped[str] = mapped_column(String(128), index=True)
    source_group_id: Mapped[str] = mapped_column(String(128), index=True)
    category: Mapped[str] = mapped_column(String(128), index=True)
    brand: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    canonical_name: Mapped[str] = mapped_column(String(255), index=True)
    display_name: Mapped[str] = mapped_column(String(255))
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    unit_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    pack_descriptor: Mapped[str | None] = mapped_column(String(255), nullable=True)
    price_lkr: Mapped[float] = mapped_column(Numeric(12, 2), index=True)
    price_per_unit_lkr: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="LKR")
    available: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    sku: Mapped[str | None] = mapped_column(String(128), nullable=True)
    url: Mapped[str] = mapped_column(String(1024))
    image_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    district: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    cluster_key: Mapped[str] = mapped_column(String(255), index=True)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    raw_offer: Mapped[RawOfferRecord | None] = relationship(back_populates="normalized_offer")


class PriceAggregateRecord(Base):
    __tablename__ = "price_aggregates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cluster_key: Mapped[str] = mapped_column(String(255), index=True)
    canonical_name: Mapped[str] = mapped_column(String(255), index=True)
    brand: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    category: Mapped[str] = mapped_column(String(128), index=True)
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    unit_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    offers_count: Mapped[int] = mapped_column(Integer)
    min_price_lkr: Mapped[float] = mapped_column(Numeric(12, 2))
    max_price_lkr: Mapped[float] = mapped_column(Numeric(12, 2))
    median_price_lkr: Mapped[float] = mapped_column(Numeric(12, 2))
    average_price_lkr: Mapped[float] = mapped_column(Numeric(12, 2))
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)


class FairPriceScoreRecord(Base):
    __tablename__ = "fair_price_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    food_offer_id: Mapped[int] = mapped_column(ForeignKey("food_offers.id"), index=True)
    source_item_id: Mapped[str] = mapped_column(String(128), index=True)
    cluster_key: Mapped[str] = mapped_column(String(255), index=True)
    median_price_lkr: Mapped[float] = mapped_column(Numeric(12, 2))
    delta_vs_median_pct: Mapped[float] = mapped_column(Float)
    price_band: Mapped[str] = mapped_column(String(32), index=True)
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)


class AlertSubscriptionRecord(Base):
    __tablename__ = "alert_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), index=True)
    scope: Mapped[str] = mapped_column(String(32), index=True)
    scope_value: Mapped[str | None] = mapped_column(String(128), nullable=True)
    cadence: Mapped[str] = mapped_column(String(16), default="weekly")
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    unsubscribe_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)


class MarketQuoteRecord(Base):
    __tablename__ = "market_quotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    district: Mapped[str] = mapped_column(String(128), index=True)
    market_name: Mapped[str] = mapped_column(String(255), index=True)
    item_name: Mapped[str] = mapped_column(String(255), index=True)
    category: Mapped[str] = mapped_column(String(128), index=True)
    unit: Mapped[str] = mapped_column(String(32), default="kg")
    price_lkr: Mapped[float] = mapped_column(Numeric(12, 2), index=True)
    source: Mapped[str] = mapped_column(String(128), index=True)
    quoted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
