from __future__ import annotations

import re
from datetime import datetime, timezone

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.core.food_filters import is_food_offer_text, retail_food_offer_clause
from app.core.market_quotes import NON_FOOD_MARKET_CATEGORIES, actionable_market_quote_cutoff
from app.models.tables import FoodOfferRecord, MarketQuoteRecord, PriceAggregateRecord


def to_iso(value: datetime | None) -> str | None:
    if not value:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc).isoformat()
    return value.isoformat()


def slugify(value: str | None) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "item"


def matches_slug(value: str | None, slug: str) -> bool:
    return slugify(value) == slug


def _slug_tokens(value: str) -> set[str]:
    return {part for part in value.split("-") if len(part) > 2}


def _image_lookup_from_offers(offers: list[FoodOfferRecord]) -> dict[str, str]:
    lookup: dict[str, str] = {}
    for offer in offers:
        if not offer.image_url:
            continue
        for value in (offer.canonical_name, offer.display_name, offer.original_title):
            key = slugify(value)
            if key and key not in lookup:
                lookup[key] = offer.image_url
    return lookup


def item_image_lookup(db: Session) -> dict[str, str]:
    offers = db.scalars(
        select(FoodOfferRecord)
        .where(FoodOfferRecord.image_url.is_not(None))
        .where(retail_food_offer_clause(FoodOfferRecord))
        .order_by(FoodOfferRecord.price_lkr.asc(), FoodOfferRecord.last_seen_at.desc())
    ).all()
    return _image_lookup_from_offers(offers)


def representative_item_image(lookup: dict[str, str], item_name: str | None) -> str | None:
    item_slug = slugify(item_name)
    if item_slug in lookup:
        return lookup[item_slug]

    item_tokens = _slug_tokens(item_slug)
    if not item_tokens:
        return None

    for candidate_slug, image_url in lookup.items():
        candidate_tokens = _slug_tokens(candidate_slug)
        if item_slug in candidate_slug or item_tokens.issubset(candidate_tokens):
            return image_url

    return None


def matching_market_item_names(db: Session, slug: str) -> list[str]:
    names = db.scalars(select(distinct(MarketQuoteRecord.item_name))).all()
    return [name for name in names if matches_slug(name, slug)]


def matching_offer_names(db: Session, slug: str) -> list[str]:
    names = db.scalars(
        select(distinct(FoodOfferRecord.canonical_name)).where(retail_food_offer_clause(FoodOfferRecord))
    ).all()
    return [name for name in names if matches_slug(name, slug)]


def item_history_series(db: Session, slug: str, district: str | None = None) -> list[dict[str, object]]:
    matching_names = matching_market_item_names(db, slug)
    if not matching_names:
        return []
    query = (
        select(MarketQuoteRecord)
        .where(MarketQuoteRecord.item_name.in_(matching_names))
        .order_by(MarketQuoteRecord.quoted_at.asc(), MarketQuoteRecord.source.asc())
    )
    if district:
        query = query.where(func.lower(MarketQuoteRecord.district) == district.lower())
    rows = db.scalars(query).all()
    grouped: dict[str, list[MarketQuoteRecord]] = {}
    for row in rows:
        period = row.quoted_at.strftime("%Y-%m-%d") if row.quoted_at else "unknown"
        grouped.setdefault(period, []).append(row)

    series = []
    for period, period_rows in sorted(grouped.items()):
        prices = [float(row.price_lkr) for row in period_rows]
        series.append(
            {
                "period": period,
                "avg_price_lkr": round(sum(prices) / len(prices), 2),
                "min_price_lkr": min(prices),
                "max_price_lkr": max(prices),
                "data_points": len(period_rows),
                "sources": sorted({row.source for row in period_rows}),
                "districts": sorted({row.district for row in period_rows}),
            }
        )
    return series


def price_prediction(series: list[dict[str, object]]) -> dict[str, object]:
    points = [row for row in series if row.get("avg_price_lkr") is not None]
    prices = [float(row["avg_price_lkr"]) for row in points]
    if len(prices) < 2:
        return {
            "direction": "insufficient-data",
            "label": "Not enough history",
            "next_estimate_lkr": None,
            "confidence": "low",
            "basis": "At least two dated price points are needed before forecasting.",
        }

    last_price = prices[-1]
    previous_price = prices[-2]
    delta_lkr = last_price - previous_price
    delta_pct = (delta_lkr / previous_price * 100) if previous_price else 0.0
    damped_next = max(0.0, last_price + (delta_lkr * 0.6))
    if abs(delta_pct) < 2:
        direction = "steady"
        label = "Likely stable"
    elif delta_pct > 0:
        direction = "up"
        label = "May increase"
    else:
        direction = "down"
        label = "May reduce"

    confidence = "high" if len(prices) >= 8 else "medium" if len(prices) >= 4 else "low"
    return {
        "direction": direction,
        "label": label,
        "next_estimate_lkr": round(damped_next, 2),
        "last_price_lkr": round(last_price, 2),
        "delta_lkr": round(delta_lkr, 2),
        "delta_pct": round(delta_pct, 2),
        "confidence": confidence,
        "basis": f"Baseline forecast from the latest {min(len(prices), 8)} historical price points.",
    }


def item_summary_rows(db: Session) -> list[dict[str, object]]:
    offer_rows = db.scalars(
        select(FoodOfferRecord)
        .where(retail_food_offer_clause(FoodOfferRecord))
        .order_by(FoodOfferRecord.price_lkr.asc())
    ).all()
    image_lookup = _image_lookup_from_offers(offer_rows)
    best_offer_by_name: dict[str, FoodOfferRecord] = {}
    sources_by_name: dict[str, set[str]] = {}
    latest_by_name: dict[str, datetime] = {}
    for offer in offer_rows:
        key = offer.canonical_name
        sources_by_name.setdefault(key, set()).add(offer.source)
        latest = latest_by_name.get(key)
        if latest is None or offer.last_seen_at > latest:
            latest_by_name[key] = offer.last_seen_at
        if key not in best_offer_by_name:
            best_offer_by_name[key] = offer

    aggregates = db.scalars(
        select(PriceAggregateRecord).order_by(PriceAggregateRecord.canonical_name.asc(), PriceAggregateRecord.brand.asc())
    ).all()
    rows: list[dict[str, object]] = []
    for row in aggregates:
        if not is_food_offer_text(row.category, row.canonical_name, row.brand):
            continue
        best_offer = best_offer_by_name.get(row.canonical_name)
        latest_updated_at = latest_by_name.get(row.canonical_name, row.calculated_at)
        rows.append(
            {
                "slug": slugify(row.canonical_name),
                "canonical_name": row.canonical_name,
                "display_name": best_offer.display_name if best_offer else row.canonical_name,
                "category": row.category,
                "kind": "retail",
                "unit": row.unit,
                "unit_amount": row.unit_amount,
                "offers_count": row.offers_count,
                "median_price_lkr": float(row.median_price_lkr),
                "lowest_price_lkr": float(best_offer.price_lkr) if best_offer else float(row.min_price_lkr),
                "price_per_unit_lkr": float(best_offer.price_per_unit_lkr) if best_offer and best_offer.price_per_unit_lkr else None,
                "image_url": best_offer.image_url if best_offer else None,
                "best_offer_id": best_offer.id if best_offer else None,
                "sources": sorted(sources_by_name.get(row.canonical_name, set())),
                "source_count": len(sources_by_name.get(row.canonical_name, set())),
                "latest_updated_at": to_iso(latest_updated_at),
            }
        )

    market_quote_filters = (
        MarketQuoteRecord.quoted_at >= actionable_market_quote_cutoff(),
        ~func.lower(func.coalesce(MarketQuoteRecord.category, "")).in_(sorted(NON_FOOD_MARKET_CATEGORIES)),
    )
    market_rows = db.execute(
        select(
            MarketQuoteRecord.item_name,
            MarketQuoteRecord.category,
            MarketQuoteRecord.unit,
            func.count(MarketQuoteRecord.id),
            func.avg(MarketQuoteRecord.price_lkr),
            func.min(MarketQuoteRecord.price_lkr),
            func.max(MarketQuoteRecord.quoted_at),
        )
        .where(*market_quote_filters)
        .group_by(MarketQuoteRecord.item_name, MarketQuoteRecord.category, MarketQuoteRecord.unit)
        .order_by(MarketQuoteRecord.item_name.asc(), MarketQuoteRecord.category.asc(), MarketQuoteRecord.unit.asc())
    ).all()
    market_source_rows = db.execute(
        select(MarketQuoteRecord.item_name, MarketQuoteRecord.source)
        .where(*market_quote_filters)
        .group_by(MarketQuoteRecord.item_name, MarketQuoteRecord.source)
        .order_by(MarketQuoteRecord.item_name.asc(), MarketQuoteRecord.source.asc())
    ).all()
    market_sources_by_name: dict[str, set[str]] = {}
    for item_name, source in market_source_rows:
        market_sources_by_name.setdefault(item_name, set()).add(source)

    for item_name, category, unit, quote_count, avg_price, min_price, latest_quoted_at in market_rows:
        sources = sorted(market_sources_by_name.get(item_name, set()))
        rows.append(
            {
                "slug": slugify(item_name),
                "canonical_name": item_name,
                "display_name": item_name,
                "category": category,
                "kind": "market",
                "unit": unit,
                "unit_amount": 1,
                "market_quotes_count": int(quote_count or 0),
                "average_market_price_lkr": round(float(avg_price), 2) if avg_price is not None else None,
                "lowest_price_lkr": round(float(min_price), 2) if min_price is not None else None,
                "image_url": representative_item_image(image_lookup, item_name),
                "sources": sources,
                "source_count": len(sources),
                "latest_updated_at": to_iso(latest_quoted_at),
            }
        )
    return rows
