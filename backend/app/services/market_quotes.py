import json
import logging
from datetime import datetime
from pathlib import Path

import httpx
from sqlalchemy import delete, func, select

from app.db.session import SessionLocal
from app.models.tables import MarketQuoteRecord

logger = logging.getLogger(__name__)


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
        db.add_all(records)
        db.commit()
        return {
            "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
        }


def _upsert_source_quotes(source: str, quotes: list[dict[str, object]]) -> dict[str, int]:
    """
    Replace all market quotes from a specific source, keeping quotes from
    other sources intact. This allows multiple scrapers to run independently.
    """
    records = [MarketQuoteRecord(**q) for q in quotes]

    with SessionLocal() as db:
        # Delete only this source's existing quotes
        db.execute(
            delete(MarketQuoteRecord).where(MarketQuoteRecord.source == source)
        )
        db.add_all(records)
        db.commit()
        return {
            "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
            "source_quotes_added": len(records),
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
    Supported sources: "wfp", "dcs", "cbsl"
    """
    from app.scrapers.cbsl import fetch_cbsl_market_quotes
    from app.scrapers.dcs import fetch_dcs_market_quotes
    from app.scrapers.wfp import fetch_wfp_market_quotes

    available: dict[str, object] = {
        "wfp": fetch_wfp_market_quotes,
        "dcs": fetch_dcs_market_quotes,
        "cbsl": fetch_cbsl_market_quotes,
    }

    run_all = sources is None or sources == ["all"] or "all" in sources
    to_run = list(available.keys()) if run_all else [s for s in (sources or []) if s in available]

    results: dict[str, object] = {}
    total_added = 0

    for source_name in to_run:
        fetcher = available[source_name]
        try:
            raw_quotes = fetcher(timeout=timeout)  # type: ignore[operator]
            if not raw_quotes:
                results[source_name] = {"status": "ok", "count": 0, "note": "No data returned"}
                continue

            # Normalize quoted_at to datetime objects
            normalized = parse_market_quotes_payload(raw_quotes)
            upsert_result = _upsert_source_quotes(source_name, normalized)
            total_added += upsert_result.get("source_quotes_added", 0)
            results[source_name] = {"status": "ok", **upsert_result}
            logger.info("Market quotes ingested from %s: %d rows", source_name, upsert_result.get("source_quotes_added", 0))

        except Exception as exc:
            logger.error("Market quote ingestion failed for source '%s': %s", source_name, exc)
            results[source_name] = {"status": "error", "error": str(exc)}

    return {
        "sources_run": to_run,
        "total_rows_added": total_added,
        "results": results,
    }
