from sqlalchemy import func, select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.tables import FoodOfferRecord, PriceAggregateRecord
from app.scrapers.cargills import fetch_cargills_catalog
from app.scrapers.glomark import fetch_glomark_catalog
from app.scrapers.keells import fetch_keells_catalog
from app.scrapers.spar2u import fetch_spar2u_catalog
from app.services.pipeline import finish_scrape_run, rebuild_normalized_views, start_scrape_run, store_raw_offers

settings = get_settings()

SOURCE_FETCHERS = {
    "spar2u": fetch_spar2u_catalog,
    "glomark": fetch_glomark_catalog,
    "keells": fetch_keells_catalog,
    "cargills": fetch_cargills_catalog,
}

_SOURCE_ENABLED = {
    "spar2u": lambda: settings.spar2u_enabled,
    "glomark": lambda: settings.glomark_enabled,
    "keells": lambda: settings.keells_enabled,
    "cargills": lambda: settings.cargills_enabled,
}


def enabled_retail_sources() -> list[str]:
    return [source for source, is_enabled in _SOURCE_ENABLED.items() if is_enabled()]


def sync_sources(sources: list[str], max_items: int | None = None) -> dict[str, object]:
    enabled = set(enabled_retail_sources())
    requested_sources = [source for source in sources if source in SOURCE_FETCHERS and source in enabled]
    skipped = [source for source in sources if source in SOURCE_FETCHERS and source not in enabled]

    if not requested_sources:
        return {
            "sources": [],
            "skipped_disabled": skipped,
            "source_results": [],
            "offers_count": 0,
            "aggregates_count": 0,
        }

    with SessionLocal() as db:
        source_results: list[dict[str, object]] = []
        for source in requested_sources:
            run = start_scrape_run(db, source)
            db.commit()
            try:
                raw_offers = SOURCE_FETCHERS[source](
                    max_items=max_items or settings.scrape_max_items_per_source,
                    user_agent=settings.scraper_user_agent,
                )
                zero_error = f"{source} returned 0 offers" if not raw_offers else None
                store_raw_offers(db, source=source, raw_offers=raw_offers, run=run)
                finish_scrape_run(
                    db,
                    run,
                    items_seen=len(raw_offers),
                    items_stored=len(raw_offers),
                    error_message=zero_error,
                )
                source_results.append(
                    {
                        "source": source,
                        "status": "failed" if zero_error else "completed",
                        "items_seen": len(raw_offers),
                        "items_stored": len(raw_offers),
                        "error": zero_error,
                    }
                )
                db.commit()
            except Exception as exc:  # pragma: no cover - network failures are environment specific
                finish_scrape_run(db, run, items_seen=0, items_stored=0, error_message=str(exc))
                source_results.append(
                    {
                        "source": source,
                        "status": "failed",
                        "items_seen": 0,
                        "items_stored": 0,
                        "error": str(exc),
                    }
                )
                db.commit()

        rebuild_normalized_views(db)
        db.commit()

        return {
            "sources": requested_sources,
            "skipped_disabled": skipped,
            "source_results": source_results,
            "offers_count": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
            "aggregates_count": db.scalar(select(func.count(PriceAggregateRecord.id))) or 0,
        }
