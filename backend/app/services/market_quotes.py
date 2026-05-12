import json
from datetime import datetime
from pathlib import Path

import httpx
from sqlalchemy import delete, func, select

from app.db.session import SessionLocal
from app.models.tables import MarketQuoteRecord


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


def _replace_market_quotes(quotes: list[dict[str, object]]) -> dict[str, int]:
    records = [MarketQuoteRecord(**quote) for quote in quotes]

    with SessionLocal() as db:
        db.execute(delete(MarketQuoteRecord))
        db.add_all(records)
        db.commit()
        return {
            "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
        }


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
