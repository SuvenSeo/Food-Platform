import logging

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.tables import FoodOfferRecord, MarketQuoteRecord, PriceAggregateRecord
from app.services.market_quotes import ingest_official_market_quotes
from app.services.source_sync import sync_sources

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    if not settings.is_development_like and settings.has_insecure_admin_key:
        raise HTTPException(
            status_code=503,
            detail="Admin API key is not securely configured for this environment.",
        )
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")


# ─────────────────────────────────────────────
# Background task helpers (own their own sessions)
# ─────────────────────────────────────────────

def _bg_retail_sync(sources: list[str], max_items: int) -> None:
    """Run retail scrape in background. sync_sources manages its own DB session."""
    try:
        logger.info("BG retail sync starting: sources=%s max_items=%d", sources, max_items)
        sync_sources(sources, max_items=max_items)
        logger.info("BG retail sync complete: sources=%s", sources)
    except Exception:
        logger.exception("BG retail sync failed: sources=%s", sources)


def _bg_market_sync(sources: list[str] | None) -> None:
    """Run official market scrape in background. ingest_official_market_quotes manages its own DB session."""
    try:
        logger.info("BG market sync starting: sources=%s", sources)
        ingest_official_market_quotes(sources=sources)
        logger.info("BG market sync complete: sources=%s", sources)
    except Exception:
        logger.exception("BG market sync failed: sources=%s", sources)


# ─────────────────────────────────────────────
# Aggregate only (fast, no scraping)
# ─────────────────────────────────────────────

@router.post("/admin/trigger/aggregate")
def trigger_aggregate(
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Re-run normalisation, clustering, and fair-price scoring from raw_offers."""
    from app.services.pipeline import rebuild_normalized_views
    rebuild_normalized_views(db)
    db.commit()
    return {
        "status": "ok",
        "offers_count": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
        "aggregates_count": db.scalar(select(func.count(PriceAggregateRecord.id))) or 0,
    }


# ─────────────────────────────────────────────
# Full retail sync — fires and returns immediately
# ─────────────────────────────────────────────

@router.post("/admin/trigger/sync")
def trigger_sync(
    background_tasks: BackgroundTasks,
    sources: list[str] | None = Query(default=None),
    max_items: int = 500,
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """
    Queue one or more retail scrapers as a background task and return immediately.

    The scrape runs inside the Fly.io process (with full database access).
    Poll GET /admin/status to track progress.

    Query params (optional):
      sources=spar2u&sources=glomark   — repeat for multiple
      max_items=500
    """
    requested = sources if sources else ["spar2u", "glomark", "keells", "cargills"]
    background_tasks.add_task(_bg_retail_sync, requested, max_items)
    return {
        "status": "queued",
        "sources": requested,
        "max_items": max_items,
        "message": "Scrape queued. Poll GET /api/v1/admin/status to verify completion.",
        "current_retail_offers": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
    }


# ─────────────────────────────────────────────
# Official market data sync — fires and returns immediately
# ─────────────────────────────────────────────

@router.post("/admin/trigger/market-sync")
def trigger_market_sync(
    background_tasks: BackgroundTasks,
    sources: list[str] | None = Query(default=None),
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """
    Queue official market scrapers (WFP, DCS, CBSL) as background tasks.

    Query params (optional):
      sources=wfp&sources=cbsl
    """
    background_tasks.add_task(_bg_market_sync, sources)
    return {
        "status": "queued",
        "sources": sources or ["wfp", "dcs", "cbsl"],
        "message": "Market scrape queued. Poll GET /api/v1/admin/status to verify completion.",
        "current_market_quotes": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
    }


# ─────────────────────────────────────────────
# Status overview
# ─────────────────────────────────────────────

@router.get("/admin/status")
def admin_status(
    _: None = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Overview of all data counts — poll this after a trigger to verify updates."""
    return {
        "retail_offers": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
        "price_aggregates": db.scalar(select(func.count(PriceAggregateRecord.id))) or 0,
        "market_quotes": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
        "retail_sources": ["spar2u", "glomark", "keells", "cargills"],
        "market_sources": ["wfp", "dcs", "cbsl"],
    }
