from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.db.session import get_database_provider_status, get_db
from app.models.tables import FairPriceScoreRecord, FoodOfferRecord, MarketQuoteRecord, PriceAggregateRecord, ScrapeRun
from app.services.trust import build_reliability_summary, compute_platform_trust_snapshot

router = APIRouter()

RETENTION_ALLOWED_CADENCE = {"daily", "weekly"}
RETENTION_ALLOWED_CHANNELS = {"email", "web"}
RETENTION_ALLOWED_COMPARE_MODES = {"district", "source", "category"}

BASKET_PRESETS: dict[str, dict[str, object]] = {
    "essentials": {
        "id": "essentials",
        "label": "Essentials Basket",
        "items": [
            {"kind": "offer", "canonical_name": "local coconut oil", "label": "Local coconut oil"},
            {"kind": "market_quote", "item_name": "Tomato", "label": "Tomato"},
        ],
    },
    "smart-saver": {
        "id": "smart-saver",
        "label": "Smart Saver",
        "items": [
            {"kind": "offer", "canonical_name": "local coconut oil", "label": "Local coconut oil"},
        ],
    },
    "market-fresh": {
        "id": "market-fresh",
        "label": "Market Fresh",
        "items": [
            {"kind": "market_quote", "item_name": "Tomato", "label": "Tomato"},
        ],
    },
}


class RetentionSubscriptionPreviewRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    cadence: str = "weekly"
    channels: list[str] = Field(default_factory=lambda: ["email"])
    districts: list[str] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)
    compare_mode: str = "district"
    top_n: int = Field(default=5, ge=1, le=20)

    @field_validator("email")
    @classmethod
    def _validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("email must be a valid address")
        return normalized

    @field_validator("cadence")
    @classmethod
    def _validate_cadence(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in RETENTION_ALLOWED_CADENCE:
            raise ValueError("cadence must be one of: daily, weekly")
        return normalized

    @field_validator("compare_mode")
    @classmethod
    def _validate_compare_mode(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in RETENTION_ALLOWED_COMPARE_MODES:
            raise ValueError("compare_mode must be one of: district, source, category")
        return normalized

    @field_validator("channels")
    @classmethod
    def _validate_channels(cls, value: list[str]) -> list[str]:
        if not value:
            raise ValueError("channels must include at least one value")
        normalized = []
        for channel in value:
            candidate = channel.strip().lower()
            if candidate not in RETENTION_ALLOWED_CHANNELS:
                raise ValueError("channels must use supported values")
            if candidate not in normalized:
                normalized.append(candidate)
        return normalized

    @field_validator("districts", "categories")
    @classmethod
    def _normalize_string_list(cls, value: list[str]) -> list[str]:
        normalized = []
        for item in value:
            candidate = item.strip()
            if candidate and candidate not in normalized:
                normalized.append(candidate)
        return normalized


def _serialize_offer_summary(offer: FoodOfferRecord, score: FairPriceScoreRecord | None) -> dict[str, object]:
    return {
        "id": offer.id,
        "source": offer.source,
        "category": offer.category,
        "brand": offer.brand,
        "display_name": offer.display_name,
        "canonical_name": offer.canonical_name,
        "price_lkr": float(offer.price_lkr),
        "price_per_unit_lkr": float(offer.price_per_unit_lkr) if offer.price_per_unit_lkr else None,
        "unit": offer.unit,
        "unit_amount": offer.unit_amount,
        "available": offer.available,
        "url": offer.url,
        "image_url": offer.image_url,
        "price_band": score.price_band if score else None,
        "delta_vs_median_pct": score.delta_vs_median_pct if score else None,
    }


def _to_iso(value: datetime | None) -> str | None:
    if not value:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc).isoformat()
    return value.isoformat()


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict[str, object]:
    return {
        "status": "ok",
        "db": "connected",
        "offers_count": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
    }


@router.get("/platform/freshness")
def platform_freshness(db: Session = Depends(get_db)) -> dict[str, object]:
    return compute_platform_trust_snapshot(db)


@router.get("/ops/reliability/summary")
def ops_reliability_summary(db: Session = Depends(get_db)) -> dict[str, object]:
    snapshot = compute_platform_trust_snapshot(db)
    return build_reliability_summary(snapshot)


@router.get("/ops/database/provider")
def ops_database_provider() -> dict[str, object]:
    return get_database_provider_status()


@router.get("/intelligence/brief")
def intelligence_brief(db: Session = Depends(get_db)) -> dict[str, object]:
    trust = compute_platform_trust_snapshot(db)
    confidence = trust["confidence"]
    freshness = trust["freshness"]
    pipeline = trust["pipeline"]
    coverage = trust["coverage"]

    top_offer = db.execute(
        select(FoodOfferRecord, FairPriceScoreRecord)
        .outerjoin(FairPriceScoreRecord, FairPriceScoreRecord.food_offer_id == FoodOfferRecord.id)
        .where(FoodOfferRecord.available.is_(True))
        .order_by(FoodOfferRecord.price_lkr.asc(), FoodOfferRecord.last_seen_at.desc())
        .limit(1)
    ).first()
    latest_market = db.scalar(
        select(MarketQuoteRecord).order_by(MarketQuoteRecord.quoted_at.desc(), MarketQuoteRecord.price_lkr.asc()).limit(1)
    )

    recommendations: list[str] = []
    if confidence["grade"] == "low":
        recommendations.append("Treat pricing as directional and verify critical decisions against live retail pages.")
    elif confidence["grade"] == "medium":
        recommendations.append("Use district and source compare flows before finalizing procurement decisions.")
    else:
        recommendations.append("Confidence is healthy; prioritize top-value monitoring and category watchlists.")

    if freshness["scrape_latency_minutes"] is not None and freshness["scrape_latency_minutes"] > 180:
        recommendations.append("Refresh ingestion soon to tighten stale intervals across discovery pages.")
    if pipeline["latest_status"] not in {"completed", None}:
        recommendations.append("Inspect latest pipeline run for failed sources before publishing insight snapshots.")
    if coverage["market_quotes_count"] < 10:
        recommendations.append("Expand market quote collection to strengthen district-level intelligence coverage.")

    if len(recommendations) < 3:
        recommendations.append("Keep basket and compare surfaces aligned with confidence notes for user trust continuity.")

    urgency = (
        "action-needed"
        if confidence["grade"] == "low"
        else "watch"
        if confidence["grade"] == "medium"
        else "routine"
    )
    headline = (
        "High-confidence signals available."
        if urgency == "routine"
        else "Signals are usable with caution."
        if urgency == "watch"
        else "Freshness risk detected; validate before acting."
    )

    return {
        "generated_at": _to_iso(datetime.now(timezone.utc)),
        "trust": trust,
        "brief": {
            "urgency": urgency,
            "headline": headline,
            "highlights": [
                {
                    "label": "Scrape latency",
                    "value": (
                        f"{freshness['scrape_latency_minutes']} min"
                        if freshness["scrape_latency_minutes"] is not None
                        else "No recent scrape"
                    ),
                },
                {
                    "label": "Pipeline health",
                    "value": f"{pipeline['healthy_sources']}/{pipeline['total_sources']} healthy sources",
                },
                {
                    "label": "Coverage depth",
                    "value": (
                        f"{coverage['offers_count']} offers · {coverage['market_quotes_count']} market quotes"
                    ),
                },
            ],
            "recommendations": recommendations[:3],
        },
        "top_value_offer": _serialize_offer_summary(top_offer[0], top_offer[1]) if top_offer else None,
        "latest_market_signal": (
            {
                "district": latest_market.district,
                "market_name": latest_market.market_name,
                "item_name": latest_market.item_name,
                "price_lkr": float(latest_market.price_lkr),
                "quoted_at": latest_market.quoted_at.isoformat() if latest_market.quoted_at else None,
            }
            if latest_market
            else None
        ),
    }


@router.get("/stats/summary")
def stats_summary(db: Session = Depends(get_db)) -> dict[str, object]:
    offers_count = db.scalar(select(func.count(FoodOfferRecord.id))) or 0
    sources_count = db.scalar(select(func.count(distinct(FoodOfferRecord.source)))) or 0
    categories_count = db.scalar(select(func.count(distinct(FoodOfferRecord.category)))) or 0
    latest_run = db.scalar(select(func.max(ScrapeRun.finished_at)))
    return {
        "offers_count": offers_count,
        "sources_count": sources_count,
        "categories_count": categories_count,
        "last_scrape_at": latest_run.isoformat() if latest_run else None,
    }


@router.get("/categories/summary")
def categories_summary(db: Session = Depends(get_db)) -> dict[str, object]:
    retail_counts = {
        category: count
        for category, count in db.execute(
            select(FoodOfferRecord.category, func.count(FoodOfferRecord.id)).group_by(FoodOfferRecord.category)
        ).all()
    }
    market_counts = {
        category: count
        for category, count in db.execute(
            select(MarketQuoteRecord.category, func.count(MarketQuoteRecord.id)).group_by(MarketQuoteRecord.category)
        ).all()
    }
    retail_price_summary = {
        category: float(price or 0)
        for category, price in db.execute(
            select(PriceAggregateRecord.category, func.avg(PriceAggregateRecord.median_price_lkr)).group_by(
                PriceAggregateRecord.category
            )
        ).all()
    }
    market_price_summary = {
        category: float(price or 0)
        for category, price in db.execute(
            select(MarketQuoteRecord.category, func.avg(MarketQuoteRecord.price_lkr)).group_by(MarketQuoteRecord.category)
        ).all()
    }

    categories = sorted(set(retail_counts) | set(market_counts))
    return {
        "items": [
            {
                "category": category,
                "retail_offers_count": retail_counts.get(category, 0),
                "market_quotes_count": market_counts.get(category, 0),
                "retail_median_lkr": retail_price_summary.get(category),
                "market_average_lkr": market_price_summary.get(category),
            }
            for category in categories
        ]
    }


@router.get("/home/summary")
def home_summary(db: Session = Depends(get_db)) -> dict[str, object]:
    latest_run = db.scalar(select(func.max(ScrapeRun.finished_at)))
    cheapest_rows = db.execute(
        select(FoodOfferRecord, FairPriceScoreRecord)
        .outerjoin(FairPriceScoreRecord, FairPriceScoreRecord.food_offer_id == FoodOfferRecord.id)
        .order_by(FoodOfferRecord.price_lkr.asc(), FoodOfferRecord.last_seen_at.desc())
        .limit(3)
    ).all()
    market_rows = db.scalars(
        select(MarketQuoteRecord)
        .order_by(MarketQuoteRecord.quoted_at.desc(), MarketQuoteRecord.item_name.asc())
        .limit(3)
    ).all()

    return {
        "hero": {
            "platform": "Sri Lanka Food Intelligence",
            "headline": "Track how food prices move across retail shelves and public markets.",
            "last_updated_at": latest_run.isoformat() if latest_run else None,
        },
        "kpis": {
            "offers_count": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
            "sources_count": db.scalar(select(func.count(distinct(FoodOfferRecord.source)))) or 0,
            "categories_count": db.scalar(select(func.count(distinct(FoodOfferRecord.category)))) or 0,
            "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
        },
        "spotlights": {
            "cheapest_offers": [_serialize_offer_summary(offer, score) for offer, score in cheapest_rows],
            "market_quotes": [
                {
                    "id": row.id,
                    "district": row.district,
                    "market_name": row.market_name,
                    "item_name": row.item_name,
                    "category": row.category,
                    "unit": row.unit,
                    "price_lkr": float(row.price_lkr),
                    "quoted_at": row.quoted_at.isoformat() if row.quoted_at else None,
                }
                for row in market_rows
            ],
        },
    }


@router.get("/intelligence/summary")
def intelligence_summary(db: Session = Depends(get_db)) -> dict[str, object]:
    ranking_rows = db.execute(
        select(FoodOfferRecord, FairPriceScoreRecord)
        .outerjoin(FairPriceScoreRecord, FairPriceScoreRecord.food_offer_id == FoodOfferRecord.id)
        .order_by(FoodOfferRecord.last_seen_at.desc(), FoodOfferRecord.price_lkr.asc())
        .limit(6)
    ).all()
    trend_rows = db.scalars(select(PriceAggregateRecord).order_by(PriceAggregateRecord.median_price_lkr.asc()).limit(6)).all()
    source_rows = db.scalars(select(ScrapeRun).order_by(ScrapeRun.finished_at.desc())).all()

    return {
        "rankings": {
            "top_value": [_serialize_offer_summary(offer, score) for offer, score in ranking_rows],
            "trend_snapshot": [
                {
                    "cluster_key": row.cluster_key,
                    "canonical_name": row.canonical_name,
                    "brand": row.brand,
                    "median_price_lkr": float(row.median_price_lkr),
                    "average_price_lkr": float(row.average_price_lkr),
                    "offers_count": row.offers_count,
                    "unit": row.unit,
                    "unit_amount": row.unit_amount,
                }
                for row in trend_rows
            ],
        },
        "sources": [
            {
                "source": row.source,
                "status": row.status,
                "items_seen": row.items_seen,
                "items_stored": row.items_stored,
                "started_at": row.started_at.isoformat() if row.started_at else None,
                "finished_at": row.finished_at.isoformat() if row.finished_at else None,
                "error_message": row.error_message,
            }
            for row in source_rows[:4]
        ],
    }


@router.get("/compare/districts")
def compare_districts(left: str, right: str, db: Session = Depends(get_db)) -> dict[str, object]:
    rows = db.scalars(
        select(MarketQuoteRecord)
        .where(MarketQuoteRecord.district.in_([left, right]))
        .order_by(MarketQuoteRecord.quoted_at.desc(), MarketQuoteRecord.item_name.asc())
    ).all()

    latest_by_side: dict[str, dict[str, MarketQuoteRecord]] = {left: {}, right: {}}
    for row in rows:
        latest_by_side[row.district].setdefault(row.item_name, row)

    common_items = sorted(set(latest_by_side[left]) & set(latest_by_side[right]))
    items = []
    for item_name in common_items:
        left_row = latest_by_side[left][item_name]
        right_row = latest_by_side[right][item_name]
        delta = float(right_row.price_lkr) - float(left_row.price_lkr)
        items.append(
            {
                "item_name": item_name,
                "category": left_row.category,
                "left_price_lkr": float(left_row.price_lkr),
                "right_price_lkr": float(right_row.price_lkr),
                "delta_lkr": delta,
                "cheaper_side": "left" if delta > 0 else "right" if delta < 0 else "equal",
            }
        )

    return {
        "mode": "district",
        "left": left,
        "right": right,
        "items": items,
    }


@router.get("/compare/sources")
def compare_sources(left: str, right: str, db: Session = Depends(get_db)) -> dict[str, object]:
    rows = db.scalars(
        select(MarketQuoteRecord)
        .where(MarketQuoteRecord.source.in_([left, right]))
        .order_by(MarketQuoteRecord.quoted_at.desc(), MarketQuoteRecord.item_name.asc())
    ).all()

    latest_by_side: dict[str, dict[str, MarketQuoteRecord]] = {left: {}, right: {}}
    for row in rows:
        latest_by_side[row.source].setdefault(row.item_name, row)

    common_items = sorted(set(latest_by_side[left]) & set(latest_by_side[right]))
    items = []
    for item_name in common_items:
        left_row = latest_by_side[left][item_name]
        right_row = latest_by_side[right][item_name]
        delta = float(right_row.price_lkr) - float(left_row.price_lkr)
        items.append(
            {
                "item_name": item_name,
                "category": left_row.category,
                "left_price_lkr": float(left_row.price_lkr),
                "right_price_lkr": float(right_row.price_lkr),
                "delta_lkr": delta,
                "cheaper_side": "left" if delta > 0 else "right" if delta < 0 else "equal",
            }
        )

    return {
        "mode": "source",
        "left": left,
        "right": right,
        "items": items,
    }


@router.get("/basket/estimate")
def basket_estimate(preset: str = Query(default="essentials"), db: Session = Depends(get_db)) -> dict[str, object]:
    preset_config = BASKET_PRESETS.get(preset)
    if not preset_config:
        raise HTTPException(status_code=404, detail="Basket preset not found")

    items = []
    total_lkr = 0.0
    available_items = 0
    totals_by_kind: dict[str, dict[str, float | int]] = {
        "offer": {"count": 0, "total_lkr": 0.0},
        "market_quote": {"count": 0, "total_lkr": 0.0},
    }

    for preset_item in preset_config["items"]:
        if preset_item["kind"] == "offer":
            offer = db.scalar(
                select(FoodOfferRecord)
                .where(FoodOfferRecord.canonical_name == preset_item["canonical_name"])
                .where(FoodOfferRecord.available.is_(True))
                .order_by(FoodOfferRecord.price_lkr.asc())
            )
            if offer:
                price = float(offer.price_lkr)
                total_lkr += price
                available_items += 1
                totals_by_kind["offer"]["count"] += 1
                totals_by_kind["offer"]["total_lkr"] += price
                alternatives = db.scalars(
                    select(FoodOfferRecord)
                    .where(FoodOfferRecord.canonical_name == preset_item["canonical_name"])
                    .where(FoodOfferRecord.available.is_(True))
                    .where(FoodOfferRecord.id != offer.id)
                    .order_by(FoodOfferRecord.price_lkr.asc())
                    .limit(3)
                ).all()
                items.append(
                    {
                        "label": preset_item["label"],
                        "kind": "offer",
                        "price_lkr": price,
                        "source": offer.source,
                        "availability_status": "available",
                        "availability_reason": "best_match_found",
                        "alternatives": [
                            {
                                "source": alt.source,
                                "label": alt.display_name,
                                "price_lkr": float(alt.price_lkr),
                            }
                            for alt in alternatives
                        ],
                    }
                )
                continue
        else:
            quote = db.scalar(
                select(MarketQuoteRecord)
                .where(MarketQuoteRecord.item_name == preset_item["item_name"])
                .order_by(MarketQuoteRecord.price_lkr.asc(), MarketQuoteRecord.quoted_at.desc())
            )
            if quote:
                price = float(quote.price_lkr)
                total_lkr += price
                available_items += 1
                totals_by_kind["market_quote"]["count"] += 1
                totals_by_kind["market_quote"]["total_lkr"] += price
                alternatives = db.scalars(
                    select(MarketQuoteRecord)
                    .where(MarketQuoteRecord.item_name == preset_item["item_name"])
                    .where(MarketQuoteRecord.id != quote.id)
                    .order_by(MarketQuoteRecord.price_lkr.asc(), MarketQuoteRecord.quoted_at.desc())
                    .limit(3)
                ).all()
                items.append(
                    {
                        "label": preset_item["label"],
                        "kind": "market_quote",
                        "price_lkr": price,
                        "source": quote.market_name,
                        "availability_status": "available",
                        "availability_reason": "best_match_found",
                        "alternatives": [
                            {
                                "source": alt.market_name,
                                "label": alt.item_name,
                                "price_lkr": float(alt.price_lkr),
                            }
                            for alt in alternatives
                        ],
                    }
                )
                continue

        if preset_item["kind"] == "offer":
            unavailable_exists = db.scalar(
                select(func.count(FoodOfferRecord.id))
                .where(FoodOfferRecord.canonical_name == preset_item["canonical_name"])
                .where(FoodOfferRecord.available.is_(False))
            )
            availability_reason = "currently_unavailable" if unavailable_exists else "no_match_found"
        else:
            availability_reason = "no_match_found"

        items.append(
            {
                "label": preset_item["label"],
                "kind": preset_item["kind"],
                "price_lkr": None,
                "source": None,
                "availability_status": "missing",
                "availability_reason": availability_reason,
                "alternatives": [],
            }
        )

    return {
        "preset": {"id": preset_config["id"], "label": preset_config["label"]},
        "available_presets": [
            {"id": config["id"], "label": config["label"]}
            for config in BASKET_PRESETS.values()
        ],
        "summary": {
            "total_lkr": total_lkr,
            "available_items": available_items,
            "missing_items": len(preset_config["items"]) - available_items,
            "totals_by_kind": totals_by_kind,
        },
        "items": items,
    }


@router.get("/offers")
def list_offers(
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    base_query = (
        select(FoodOfferRecord, FairPriceScoreRecord)
        .outerjoin(FairPriceScoreRecord, FairPriceScoreRecord.food_offer_id == FoodOfferRecord.id)
        .order_by(FoodOfferRecord.last_seen_at.desc())
    )

    count_query = select(func.count(FoodOfferRecord.id))
    if category:
        base_query = base_query.where(FoodOfferRecord.category == category.lower())
        count_query = count_query.where(FoodOfferRecord.category == category.lower())
    if search:
        term = f"%{search.lower()}%"
        base_query = base_query.where(func.lower(FoodOfferRecord.display_name).like(term))
        count_query = count_query.where(func.lower(FoodOfferRecord.display_name).like(term))

    rows = db.execute(base_query.limit(limit).offset(offset)).all()
    total = db.scalar(count_query) or 0

    items = [
        _serialize_offer_summary(offer, score)
        for offer, score in rows
    ]
    return {"items": items, "total": total}


@router.get("/offers/{offer_id}")
def get_offer(offer_id: int, db: Session = Depends(get_db)) -> dict[str, object]:
    row = db.execute(
        select(FoodOfferRecord, FairPriceScoreRecord)
        .outerjoin(FairPriceScoreRecord, FairPriceScoreRecord.food_offer_id == FoodOfferRecord.id)
        .where(FoodOfferRecord.id == offer_id)
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Offer not found")
    offer, score = row
    return _serialize_offer_summary(offer, score)


@router.get("/pipeline/status")
def pipeline_status(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    rows = db.scalars(
        select(ScrapeRun)
        .order_by(ScrapeRun.started_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    total = db.scalar(select(func.count(ScrapeRun.id))) or 0
    return {
        "items": [
            {
                "source": row.source,
                "status": row.status,
                "items_seen": row.items_seen,
                "items_stored": row.items_stored,
                "started_at": row.started_at.isoformat() if row.started_at else None,
                "finished_at": row.finished_at.isoformat() if row.finished_at else None,
                "error_message": row.error_message,
            }
            for row in rows
        ],
        "total": total,
    }


@router.get("/market-quotes")
def market_quotes(
    district: str | None = Query(default=None),
    category: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    query = select(MarketQuoteRecord).order_by(MarketQuoteRecord.quoted_at.desc(), MarketQuoteRecord.item_name.asc())
    count_query = select(func.count(MarketQuoteRecord.id))

    if district:
        query = query.where(MarketQuoteRecord.district == district)
        count_query = count_query.where(MarketQuoteRecord.district == district)
    if category:
        query = query.where(MarketQuoteRecord.category == category)
        count_query = count_query.where(MarketQuoteRecord.category == category)

    rows = db.scalars(query.limit(limit).offset(offset)).all()
    total = db.scalar(count_query) or 0
    return {
        "items": [
            {
                "id": row.id,
                "district": row.district,
                "market_name": row.market_name,
                "item_name": row.item_name,
                "category": row.category,
                "unit": row.unit,
                "price_lkr": float(row.price_lkr),
                "source": row.source,
                "quoted_at": row.quoted_at.isoformat() if row.quoted_at else None,
                "notes": row.notes,
            }
            for row in rows
        ],
        "total": total,
    }


@router.get("/hub/manifest")
def hub_manifest() -> dict[str, object]:
    return {
        "platform": "food",
        "version": "0.1.0",
        "summary_endpoint": "/api/v1/hub/summary",
        "routes": {
            "overview": "/",
            "intelligence": "/intelligence",
            "retail": "/retail",
            "markets": "/markets",
            "categories": "/categories",
            "compare": "/compare",
            "basket": "/basket",
            "watchlists": "/watchlists",
            "methods": "/methods",
            "pipeline": "/pipeline",
        },
        "datasets": {
            "offers": "/api/v1/offers",
            "trends": "/api/v1/trends/{category}",
            "market_quotes": "/api/v1/market-quotes",
            "categories_summary": "/api/v1/categories/summary",
            "district_compare": "/api/v1/compare/districts?left={left}&right={right}",
            "source_compare": "/api/v1/compare/sources?left={left}&right={right}",
            "basket_estimate": "/api/v1/basket/estimate?preset={preset}",
            "retention_schema": "/api/v1/retention/subscriptions/schema",
            "retention_preview": "/api/v1/retention/subscriptions/preview",
        },
        "linked_platforms": {
            "property": {
                "url": "https://propertylk-one.vercel.app/",
                "mode": "read-only federation",
            },
            "vehicle": {
                "url": "https://vehicle-platform-one.vercel.app/",
                "mode": "read-only federation",
            },
            "octane": {
                "url": "https://octane-smoky.vercel.app/",
                "mode": "read-only federation",
            },
        },
        "auth_strategy": "defer shared auth and keep SSO out of Phase 1",
    }


@router.get("/hub/summary")
def hub_summary(db: Session = Depends(get_db)) -> dict[str, object]:
    return {
        "platform": "food",
        "coverage": {
            "offers_count": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
            "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
            "sources_count": db.scalar(select(func.count(distinct(FoodOfferRecord.source)))) or 0,
            "categories_count": db.scalar(select(func.count(distinct(FoodOfferRecord.category)))) or 0,
        },
        "available_pages": [
            "home",
            "intelligence",
            "retail",
            "markets",
            "categories",
            "compare",
            "basket",
            "watchlists",
            "methods",
            "pipeline",
        ],
        "utility_surfaces": {
            "basket_preset": "essentials",
            "compare_mode": "district",
            "watchlists_storage": "local-browser",
            "retention_preview": "ready",
        },
    }


@router.get("/retention/subscriptions/schema")
def retention_subscription_schema() -> dict[str, object]:
    return {
        "version": "0.1",
        "fields": {
            "email": {"type": "string", "required": True},
            "cadence": {"type": "string", "allowed": sorted(RETENTION_ALLOWED_CADENCE), "default": "weekly"},
            "channels": {"type": "array", "allowed": sorted(RETENTION_ALLOWED_CHANNELS), "default": ["email"]},
            "districts": {"type": "array", "item_type": "string", "default": []},
            "categories": {"type": "array", "item_type": "string", "default": []},
            "compare_mode": {
                "type": "string",
                "allowed": sorted(RETENTION_ALLOWED_COMPARE_MODES),
                "default": "district",
            },
            "top_n": {"type": "integer", "min": 1, "max": 20, "default": 5},
        },
    }


@router.post("/retention/subscriptions/preview")
def retention_subscription_preview(
    payload: RetentionSubscriptionPreviewRequest, db: Session = Depends(get_db)
) -> dict[str, object]:
    count_query = select(func.count(MarketQuoteRecord.id))
    district_count_query = select(func.count(distinct(MarketQuoteRecord.district)))
    source_count_query = select(func.count(distinct(MarketQuoteRecord.source)))

    if payload.districts:
        count_query = count_query.where(MarketQuoteRecord.district.in_(payload.districts))
        district_count_query = district_count_query.where(MarketQuoteRecord.district.in_(payload.districts))
        source_count_query = source_count_query.where(MarketQuoteRecord.district.in_(payload.districts))
    if payload.categories:
        lowered_categories = [category.lower() for category in payload.categories]
        count_query = count_query.where(func.lower(MarketQuoteRecord.category).in_(lowered_categories))
        district_count_query = district_count_query.where(func.lower(MarketQuoteRecord.category).in_(lowered_categories))
        source_count_query = source_count_query.where(func.lower(MarketQuoteRecord.category).in_(lowered_categories))

    matching_market_quotes = db.scalar(count_query) or 0
    distinct_districts = db.scalar(district_count_query) or 0
    distinct_sources = db.scalar(source_count_query) or 0
    tracked_categories = sorted({category.lower() for category in payload.categories}) if payload.categories else []

    return {
        "accepted": True,
        "subscription": {
            "email": payload.email,
            "cadence": payload.cadence,
            "channels": payload.channels,
            "districts": payload.districts,
            "categories": tracked_categories,
            "compare_mode": payload.compare_mode,
            "top_n": payload.top_n,
        },
        "preview": {
            "digest_title": f"{payload.cadence.capitalize()} Food Watch",
            "signals": {
                "matching_market_quotes": matching_market_quotes,
                "distinct_districts": distinct_districts,
                "distinct_sources": distinct_sources,
                "tracked_categories": tracked_categories,
            },
            "integration_status": "preview-only",
        },
    }


# ──────────────────────────────────────────────
# Price Trends (historical intelligence)
# ──────────────────────────────────────────────

@router.get("/trends/market")
def get_market_price_trends(
    item: str = Query(..., description="Item name to query (e.g. 'Rice (red nadu)')"),
    district: str | None = Query(None, description="Filter by district"),
    granularity: str = Query("monthly", description="monthly | yearly"),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """
    Return historical price trend for a specific market quote item.

    Uses all available market_quotes data (WFP historical + CBSL + DCS).
    Returns monthly or yearly average prices suitable for Recharts LineChart.
    """
    provider = get_database_provider_status()
    dialect = provider.get("dialect", "sqlite")

    if dialect.startswith("postgresql"):
        if granularity == "yearly":
            period_expr = func.date_trunc("year", MarketQuoteRecord.quoted_at)
            period_fmt = "YYYY"
        else:
            period_expr = func.date_trunc("month", MarketQuoteRecord.quoted_at)
            period_fmt = "YYYY-MM"
        period_label = func.to_char(period_expr, period_fmt)
    else:
        # SQLite
        if granularity == "yearly":
            period_label = func.strftime("%Y", MarketQuoteRecord.quoted_at)
        else:
            period_label = func.strftime("%Y-%m", MarketQuoteRecord.quoted_at)

    q = (
        select(
            period_label.label("period"),
            func.avg(MarketQuoteRecord.price_lkr).label("avg_price"),
            func.min(MarketQuoteRecord.price_lkr).label("min_price"),
            func.max(MarketQuoteRecord.price_lkr).label("max_price"),
            func.count().label("data_points"),
        )
        .where(func.lower(MarketQuoteRecord.item_name).contains(item.lower()))
        .group_by(period_label.label("period"))
        .order_by(period_label.label("period"))
    )

    if district:
        q = q.where(func.lower(MarketQuoteRecord.district).contains(district.lower()))

    rows = db.execute(q).fetchall()

    series = [
        {
            "period": row.period,
            "avg_price": round(float(row.avg_price), 2) if row.avg_price else None,
            "min_price": round(float(row.min_price), 2) if row.min_price else None,
            "max_price": round(float(row.max_price), 2) if row.max_price else None,
            "data_points": row.data_points,
        }
        for row in rows
    ]

    return {
        "item": item,
        "district": district,
        "granularity": granularity,
        "series": series,
        "total_data_points": sum(s["data_points"] for s in series),
        "date_range": {
            "from": series[0]["period"] if series else None,
            "to": series[-1]["period"] if series else None,
        },
    }


@router.get("/trends/summary")
def get_trends_summary(db: Session = Depends(get_db)) -> dict[str, object]:
    """
    Return a summary of available price trend data:
    - Top items by historical data coverage
    - Year range available
    - Source breakdown
    """
    # Top items by data points
    top_items_q = (
        select(
            MarketQuoteRecord.item_name,
            func.count().label("count"),
            func.min(MarketQuoteRecord.quoted_at).label("earliest"),
            func.max(MarketQuoteRecord.quoted_at).label("latest"),
            func.avg(MarketQuoteRecord.price_lkr).label("avg_price"),
        )
        .group_by(MarketQuoteRecord.item_name)
        .order_by(func.count().desc())
        .limit(20)
    )
    top_items = [
        {
            "item_name": row.item_name,
            "data_points": row.count,
            "earliest": _to_iso(row.earliest),
            "latest": _to_iso(row.latest),
            "avg_price_lkr": round(float(row.avg_price), 2) if row.avg_price else None,
        }
        for row in db.execute(top_items_q).fetchall()
    ]

    # Source breakdown
    source_q = (
        select(
            MarketQuoteRecord.source,
            func.count().label("count"),
            func.min(MarketQuoteRecord.quoted_at).label("earliest"),
            func.max(MarketQuoteRecord.quoted_at).label("latest"),
        )
        .group_by(MarketQuoteRecord.source)
        .order_by(func.count().desc())
    )
    sources = [
        {
            "source": row.source,
            "data_points": row.count,
            "earliest": _to_iso(row.earliest),
            "latest": _to_iso(row.latest),
        }
        for row in db.execute(source_q).fetchall()
    ]

    total = db.scalar(select(func.count(MarketQuoteRecord.id))) or 0

    return {
        "total_market_data_points": total,
        "top_items": top_items,
        "sources": sources,
    }


# IMPORTANT: this catch-all must stay below the static /trends/* routes above.
# FastAPI matches in declaration order; if it moves up, /trends/market and
# /trends/summary get swallowed as category="market" / category="summary".
@router.get("/trends/{category}")
def trends(category: str, db: Session = Depends(get_db)) -> dict[str, object]:
    rows = db.scalars(
        select(PriceAggregateRecord)
        .where(PriceAggregateRecord.category == category.lower())
        .order_by(PriceAggregateRecord.canonical_name.asc())
    ).all()
    return {
        "items": [
            {
                "cluster_key": row.cluster_key,
                "canonical_name": row.canonical_name,
                "brand": row.brand,
                "median_price_lkr": float(row.median_price_lkr),
                "average_price_lkr": float(row.average_price_lkr),
                "offers_count": row.offers_count,
                "unit": row.unit,
                "unit_amount": row.unit_amount,
            }
            for row in rows
        ]
    }
