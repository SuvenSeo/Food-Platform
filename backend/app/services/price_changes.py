"""Recent retail and market price movement events for the /changes feed."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.tables import FairPriceScoreRecord, FoodOfferRecord, MarketQuoteRecord


def list_price_changes(db: Session, *, limit: int = 50) -> dict[str, object]:
    retail_limit = max(1, limit // 2)
    market_limit = max(1, limit - retail_limit)

    retail_rows = db.execute(
        select(FoodOfferRecord, FairPriceScoreRecord)
        .join(FairPriceScoreRecord, FairPriceScoreRecord.food_offer_id == FoodOfferRecord.id)
        .where(FoodOfferRecord.available.is_(True))
        .order_by(
            func.abs(FairPriceScoreRecord.delta_vs_median_pct).desc(),
            FoodOfferRecord.last_seen_at.desc(),
        )
        .limit(retail_limit)
    ).all()

    retail_events: list[dict[str, object]] = []
    for offer, score in retail_rows:
        delta_pct = float(score.delta_vs_median_pct)
        retail_events.append(
            {
                "kind": "retail_offer",
                "source": offer.source,
                "label": offer.display_name,
                "category": offer.category,
                "price_lkr": float(offer.price_lkr),
                "median_price_lkr": float(score.median_price_lkr),
                "delta_vs_median_pct": delta_pct,
                "price_band": score.price_band,
                "observed_at": offer.last_seen_at.isoformat() if offer.last_seen_at else None,
                "direction": "up" if delta_pct >= 5 else "down" if delta_pct <= -5 else "flat",
            }
        )

    market_events = _market_revision_events(db, limit=market_limit)

    combined = sorted(
        retail_events + market_events,
        key=lambda row: row.get("observed_at") or "",
        reverse=True,
    )[:limit]

    return {
        "items": combined,
        "counts": {
            "retail": len(retail_events),
            "market": len(market_events),
            "total": len(combined),
        },
    }


def _market_revision_events(db: Session, *, limit: int) -> list[dict[str, object]]:
    rows = db.scalars(
        select(MarketQuoteRecord).order_by(
            MarketQuoteRecord.item_name.asc(),
            MarketQuoteRecord.district.asc(),
            MarketQuoteRecord.quoted_at.desc(),
        )
    ).all()

    events: list[dict[str, object]] = []
    seen_keys: set[tuple[str, str, float]] = set()

    by_key: dict[tuple[str, str], list[MarketQuoteRecord]] = {}
    for row in rows:
        key = (row.item_name, row.district)
        by_key.setdefault(key, []).append(row)

    for (item_name, district), quotes in by_key.items():
        if len(quotes) < 2:
            continue
        latest = quotes[0]
        previous = quotes[1]
        if float(latest.price_lkr) == float(previous.price_lkr):
            continue
        dedupe = (item_name, district, float(latest.price_lkr))
        if dedupe in seen_keys:
            continue
        seen_keys.add(dedupe)
        delta = float(latest.price_lkr) - float(previous.price_lkr)
        prev_price = float(previous.price_lkr)
        delta_pct = (delta / prev_price * 100) if prev_price else None
        events.append(
            {
                "kind": "market_quote",
                "source": latest.source,
                "label": item_name,
                "category": latest.category,
                "district": district,
                "market_name": latest.market_name,
                "price_lkr": float(latest.price_lkr),
                "previous_lkr": prev_price,
                "delta_lkr": delta,
                "delta_pct": delta_pct,
                "observed_at": latest.quoted_at.isoformat() if latest.quoted_at else None,
                "direction": "up" if delta > 0 else "down",
            }
        )

    events.sort(key=lambda row: row.get("observed_at") or "", reverse=True)
    return events[:limit]
