from fastapi import APIRouter, Depends, Query
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tables import FairPriceScoreRecord, FoodOfferRecord, MarketQuoteRecord, PriceAggregateRecord, ScrapeRun

router = APIRouter()


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
        "price_band": score.price_band if score else None,
        "delta_vs_median_pct": score.delta_vs_median_pct if score else None,
    }


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict[str, object]:
    return {
        "status": "ok",
        "db": "connected",
        "offers_count": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
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
        return {"detail": "Not found"}
    offer, score = row
    return _serialize_offer_summary(offer, score)


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


@router.get("/pipeline/status")
def pipeline_status(db: Session = Depends(get_db)) -> dict[str, object]:
    rows = db.scalars(select(ScrapeRun).order_by(ScrapeRun.started_at.desc())).all()
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
        ]
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
            "explore": "/explore",
            "trends": "/trends",
            "pipeline": "/pipeline",
        },
        "datasets": {
            "offers": "/api/v1/offers",
            "trends": "/api/v1/trends/{category}",
            "market_quotes": "/api/v1/market-quotes",
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
        "offers_count": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
        "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
        "sources_count": db.scalar(select(func.count(distinct(FoodOfferRecord.source)))) or 0,
    }
