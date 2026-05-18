"""HTML embed badge summaries for category or basket totals."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.basket_presets import BASKET_PRESETS
from app.models.tables import FoodOfferRecord, MarketQuoteRecord


def resolve_embed_summary(
    db: Session,
    *,
    kind: str,
    category: str | None,
    preset: str | None,
) -> dict[str, str | float]:
    normalized_kind = kind.strip().lower()
    if normalized_kind == "basket":
        preset_id = (preset or "essentials").strip().lower()
        preset_config = BASKET_PRESETS.get(preset_id)
        if not preset_config:
            raise KeyError("preset")
        total = 0.0
        count = 0
        for preset_item in preset_config["items"]:
            if preset_item["kind"] == "offer":
                offer = db.scalar(
                    select(FoodOfferRecord)
                    .where(FoodOfferRecord.canonical_name == preset_item["canonical_name"])
                    .where(FoodOfferRecord.available.is_(True))
                    .order_by(FoodOfferRecord.price_lkr.asc())
                )
                if offer:
                    total += float(offer.price_lkr)
                    count += 1
            else:
                quote = db.scalar(
                    select(MarketQuoteRecord)
                    .where(MarketQuoteRecord.item_name == preset_item["item_name"])
                    .order_by(MarketQuoteRecord.price_lkr.asc(), MarketQuoteRecord.quoted_at.desc())
                )
                if quote:
                    total += float(quote.price_lkr)
                    count += 1
        return {
            "label": str(preset_config["label"]),
            "value": total,
            "meta": f"{count} tracked items",
            "kind": "basket",
        }

    if normalized_kind == "category":
        category_key = (category or "grocery").strip().lower()
        row = db.execute(
            select(
                func.min(FoodOfferRecord.price_lkr),
                func.count(FoodOfferRecord.id),
            ).where(FoodOfferRecord.category == category_key)
        ).one()
        min_price, offer_count = row
        if not offer_count:
            raise KeyError("category")
        return {
            "label": category_key.replace("-", " ").title(),
            "value": float(min_price or 0),
            "meta": f"from {offer_count} offers",
            "kind": "category",
        }

    raise ValueError("kind must be category or basket")
