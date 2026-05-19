import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import httpx
from sqlalchemy import delete, func, select

from app.db.session import SessionLocal
from app.db.sequences import sync_postgres_id_sequence
from app.models.tables import MarketQuoteRecord, ScrapeRun
from app.services.pipeline import finish_scrape_run, start_scrape_run

logger = logging.getLogger(__name__)


def _fetch_wfp_market_quotes(*, timeout: float = 30.0) -> list[dict[str, object]]:
    from app.scrapers.wfp import fetch_wfp_market_quotes

    return fetch_wfp_market_quotes(timeout=timeout)


def _fetch_dcs_market_quotes(*, timeout: float = 30.0) -> list[dict[str, object]]:
    from app.scrapers.dcs import fetch_dcs_market_quotes

    return fetch_dcs_market_quotes(timeout=timeout)


def _fetch_cbsl_market_quotes(*, timeout: float = 30.0) -> list[dict[str, object]]:
    from app.scrapers.cbsl import fetch_cbsl_market_quotes

    return fetch_cbsl_market_quotes(timeout=timeout)


def _fetch_doa_market_quotes(*, timeout: float = 30.0) -> list[dict[str, object]]:
    from app.scrapers.doa import fetch_doa_market_quotes

    return fetch_doa_market_quotes(timeout=timeout)


def _fetch_harti_market_quotes(*, timeout: float = 30.0) -> list[dict[str, object]]:
    from app.scrapers.harti import fetch_harti_market_quotes

    return fetch_harti_market_quotes(timeout=timeout)


def _fetch_fisheries_market_quotes(*, timeout: float = 30.0) -> list[dict[str, object]]:
    from app.scrapers.fisheries import fetch_fisheries_market_quotes

    return fetch_fisheries_market_quotes(timeout=timeout)


OFFICIAL_MARKET_FETCHERS = {
    "wfp": _fetch_wfp_market_quotes,
    "dcs": _fetch_dcs_market_quotes,
    "cbsl": _fetch_cbsl_market_quotes,
    "doa": _fetch_doa_market_quotes,
    "harti": _fetch_harti_market_quotes,
    "fisheries": _fetch_fisheries_market_quotes,
}


# ─────────────────────────────────────────────
# Parsing helpers
# ─────────────────────────────────────────────

def _extract_items(payload: object) -> list[dict[str, object]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        items = payload.get("items")
        if isinstance(items, list):
            return items
    raise ValueError("Market quote payload must be a JSON array or an object with an 'items' list.")


def _parse_quoted_at(raw_value: object, *, index: int) -> datetime:
    if not isinstance(raw_value, str) or not raw_value.strip():
        raise ValueError(f"Market quote at index {index} is missing a valid 'quoted_at' value.")
    return datetime.fromisoformat(raw_value.replace("Z", "+00:00"))


def _normalize_quote_item(item: object, *, index: int) -> dict[str, object]:
    if not isinstance(item, dict):
        raise ValueError(f"Market quote at index {index} must be an object.")
    required_keys = ("district", "market_name", "item_name", "category", "price_lkr", "quoted_at")
    missing_keys = [key for key in required_keys if key not in item]
    if missing_keys:
        raise ValueError(f"Market quote at index {index} is missing required fields: {', '.join(missing_keys)}.")

    return {
        "district": str(item["district"]).strip(),
        "market_name": str(item["market_name"]).strip(),
        "item_name": str(item["item_name"]).strip(),
        "category": str(item["category"]).strip().lower(),
        "unit": str(item.get("unit", "kg")).strip() or "kg",
        "price_lkr": float(item["price_lkr"]),
        "source": str(item.get("source", "seed")).strip() or "seed",
        "quoted_at": _parse_quoted_at(item["quoted_at"], index=index),
        "notes": item.get("notes"),
    }


def parse_market_quotes_payload(payload: object) -> list[dict[str, object]]:
    return [_normalize_quote_item(item, index=index) for index, item in enumerate(_extract_items(payload))]


# ─────────────────────────────────────────────
# Storage helpers
# ─────────────────────────────────────────────

def _replace_market_quotes(quotes: list[dict[str, object]]) -> dict[str, int]:
    """Replace all market quotes in the database with the provided list."""
    records = [MarketQuoteRecord(**quote) for quote in quotes]

    with SessionLocal() as db:
        db.execute(delete(MarketQuoteRecord))
        if records:
            sync_postgres_id_sequence(db, MarketQuoteRecord.__tablename__)
        db.add_all(records)
        db.commit()
        return {
            "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
        }


def _quoted_at_key(value: object) -> str:
    if isinstance(value, datetime):
        dt = value.astimezone(timezone.utc).replace(tzinfo=None) if value.tzinfo else value
        return dt.isoformat(timespec="seconds")
    return str(value)


def _quote_key(quote: dict[str, object]) -> tuple[str, str, str, str, str, str, str]:
    quoted_at_key = _quoted_at_key(quote["quoted_at"])
    return (
        str(quote["source"]).strip().lower(),
        str(quote["district"]).strip().lower(),
        str(quote["market_name"]).strip().lower(),
        str(quote["item_name"]).strip().lower(),
        str(quote["category"]).strip().lower(),
        str(quote["unit"]).strip().lower(),
        quoted_at_key,
    )


def _row_key(row: MarketQuoteRecord) -> tuple[str, str, str, str, str, str, str]:
    quoted_at_key = _quoted_at_key(row.quoted_at) if row.quoted_at else ""
    return (
        row.source.strip().lower(),
        row.district.strip().lower(),
        row.market_name.strip().lower(),
        row.item_name.strip().lower(),
        row.category.strip().lower(),
        row.unit.strip().lower(),
        quoted_at_key,
    )


def _upsert_source_quotes(source: str, quotes: list[dict[str, object]]) -> dict[str, int]:
    """
    Upsert quotes from one source without deleting older rows first.

    This prevents a partial or zero-row official feed response from wiping
    historical coverage for that source.
    """
    with SessionLocal() as db:
        existing = {
            _row_key(row): row
            for row in db.scalars(select(MarketQuoteRecord).where(MarketQuoteRecord.source == source)).all()
        }
        seen_keys: set[tuple[str, str, str, str, str, str, str]] = set()
        added = 0
        updated = 0
        if quotes:
            sync_postgres_id_sequence(db, MarketQuoteRecord.__tablename__)
        for quote in quotes:
            quote = {**quote, "source": source}
            key = _quote_key(quote)
            if key in seen_keys:
                continue
            seen_keys.add(key)
            existing_row = existing.get(key)
            if existing_row:
                existing_row.price_lkr = float(quote["price_lkr"])
                existing_row.notes = quote.get("notes")
                updated += 1
            else:
                db.add(MarketQuoteRecord(**quote))
                added += 1
        db.commit()
        return {
            "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
            "source_quotes_added": added,
            "source_quotes_updated": updated,
            "source_quotes_total": db.scalar(
                select(func.count(MarketQuoteRecord.id)).where(MarketQuoteRecord.source == source)
            )
            or 0,
        }


# ─────────────────────────────────────────────
# Public ingestion functions
# ─────────────────────────────────────────────

def ingest_market_quotes_from_file(path: Path) -> dict[str, int]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    quotes = parse_market_quotes_payload(payload)
    return _replace_market_quotes(quotes)


def ingest_market_quotes_from_url(url: str, timeout_seconds: float, payload_format: str = "json") -> dict[str, int]:
    normalized_format = payload_format.strip().lower()
    if normalized_format != "json":
        raise ValueError(f"Unsupported MARKET_QUOTES_FORMAT '{payload_format}'. Only 'json' is currently supported.")

    response = httpx.get(url, timeout=timeout_seconds)
    response.raise_for_status()
    payload = response.json()
    quotes = parse_market_quotes_payload(payload)
    return _replace_market_quotes(quotes)


def ingest_official_market_quotes(
    sources: list[str] | None = None,
    timeout: float = 30.0,
) -> dict[str, object]:
    """
    Run one or more official data source scrapers and upsert their quotes.

    sources: list of source names to run, or None / ["all"] to run all.
    Supported sources: "wfp", "dcs", "cbsl", "doa", "harti", "fisheries"
    """
    run_all = sources is None or sources == ["all"] or "all" in sources
    to_run = list(OFFICIAL_MARKET_FETCHERS.keys()) if run_all else [s for s in (sources or []) if s in OFFICIAL_MARKET_FETCHERS]

    results: dict[str, object] = {}
    total_added = 0
    total_stored = 0

    for source_name in to_run:
        fetcher = OFFICIAL_MARKET_FETCHERS[source_name]
        run_id: int | None = None
        try:
            with SessionLocal() as db:
                run = start_scrape_run(db, source_name)
                run_id = run.id
                db.commit()

            raw_quotes = fetcher(timeout=timeout)  # type: ignore[operator]
            if not raw_quotes:
                error_message = "source returned zero market quote rows"
                with SessionLocal() as db:
                    scrape_run = db.get(ScrapeRun, run_id) if run_id is not None else None
                    if scrape_run:
                        finish_scrape_run(db, scrape_run, items_seen=0, items_stored=0, error_message=error_message)
                        db.commit()
                results[source_name] = {"status": "error", "count": 0, "error": error_message}
                continue

            # Normalize quoted_at to datetime objects
            normalized = parse_market_quotes_payload(raw_quotes)
            upsert_result = _upsert_source_quotes(source_name, normalized)
            total_added += upsert_result.get("source_quotes_added", 0)
            total_stored += len(normalized)
            with SessionLocal() as db:
                scrape_run = db.get(ScrapeRun, run_id) if run_id is not None else None
                if scrape_run:
                    finish_scrape_run(db, scrape_run, items_seen=len(raw_quotes), items_stored=len(normalized))
                    db.commit()
            results[source_name] = {"status": "ok", **upsert_result}
            logger.info("Market quotes ingested from %s: %d rows", source_name, upsert_result.get("source_quotes_added", 0))

        except Exception as exc:
            logger.error("Market quote ingestion failed for source '%s': %s", source_name, exc)
            if run_id is not None:
                with SessionLocal() as db:
                    scrape_run = db.get(ScrapeRun, run_id)
                    if scrape_run:
                        finish_scrape_run(db, scrape_run, items_seen=0, items_stored=0, error_message=str(exc))
                        db.commit()
            results[source_name] = {"status": "error", "error": str(exc)}

    return {
        "sources_run": to_run,
        "total_rows_added": total_added,
        "total_rows_stored": total_stored,
        "results": results,
    }
