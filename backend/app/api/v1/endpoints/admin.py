from fastapi import APIRouter, Depends, Header, HTTPException, BackgroundTasks
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.tables import FoodOfferRecord, MarketQuoteRecord, PriceAggregateRecord
from app.services.pipeline import rebuild_normalized_views
from app.services.market_quotes import ingest_official_market_quotes
from app.services.source_sync import sync_sources

router = APIRouter()
settings = get_settings()


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    if not settings.is_development_like and settings.has_insecure_admin_key:
        raise HTTPException(
            status_code=503,
            detail="Admin API key is not securely configured for this environment.",
        )
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")


# ─────────────────────────────────────────────
# Aggregate only (fast, no scraping)
# ─────────────────────────────────────────────

@router.post("/admin/trigger/aggregate")
def trigger_aggregate(
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Re-run normalisation, clustering, and fair-price scoring from raw_offers."""
    rebuild_normalized_views(db)
    db.commit()
    return {
        "status": "ok",
        "offers_count": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
        "aggregates_count": db.scalar(select(func.count(PriceAggregateRecord.id))) or 0,
    }


# ─────────────────────────────────────────────
# Full retail sync (scrape + aggregate)
# ─────────────────────────────────────────────

@router.post("/admin/trigger/sync")
def trigger_sync(
    sources: list[str] | None = None,
    max_items: int = 500,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """
    Run one or more retail scrapers, store raw offers, and rebuild normalised views.

    Body (optional JSON):
      {
        "sources": ["spar2u", "glomark", "keells", "cargills"],
        "max_items": 500
      }

    Defaults to running ALL registered sources at 500 items each.
    """
    all_sources = list(settings.scrape_max_items_per_source and ["spar2u", "glomark", "keells", "cargills"])
    requested = sources if sources else ["spar2u", "glomark", "keells", "cargills"]

    result = sync_sources(requested, max_items=max_items)

    return {
        "status": "ok",
        **result,
        "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
    }


# ─────────────────────────────────────────────
# Official market data sync (WFP, DCS, CBSL)
# ─────────────────────────────────────────────

@router.post("/admin/trigger/market-sync")
def trigger_market_sync(
    sources: list[str] | None = None,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """
    Pull latest market price data from official Sri Lankan government/IGO sources.

    Body (optional JSON):
      {"sources": ["wfp", "dcs", "cbsl"]}

    Defaults to running all three official sources.
    """
    result = ingest_official_market_quotes(sources=sources)

    return {
        "status": "ok",
        **result,
        "total_market_quotes": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
    }


# ─────────────────────────────────────────────
# Status overview
# ─────────────────────────────────────────────

@router.get("/admin/status")
def admin_status(
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Overview of all data counts — useful for verifying a sync worked."""
    return {
        "retail_offers": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
        "price_aggregates": db.scalar(select(func.count(PriceAggregateRecord.id))) or 0,
        "market_quotes": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
        "retail_sources": ["spar2u", "glomark", "keells", "cargills"],
        "market_sources": ["wfp", "dcs", "cbsl"],
    }
