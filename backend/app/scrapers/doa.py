"""
Department of Agriculture / SHEP daily vegetable price scraper.

Source page:
  https://infohub.doa.gov.lk/vegetable-prices/

The chart page loads JSON from WordPress admin-ajax:
  /wp-admin/admin-ajax.php?action=get_veg_data&item=Beans

Rows include daily wholesale and retail prices for Manning and Dambulla.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx

logger = logging.getLogger(__name__)

DOA_BASE_URL = "https://infohub.doa.gov.lk"
DOA_AJAX_PATH = "/wp-admin/admin-ajax.php"
DOA_REFERER = "https://infohub.doa.gov.lk/vegetable-prices-all/"

DOA_ITEMS: tuple[str, ...] = (
    "Beans",
    "Carrot",
    "Cabbage",
    "Tomato",
    "Brinjal",
    "Snake Gourd",
    "Pumpkin",
    "Green Chilli",
    "Lime",
)

PRICE_FIELDS: tuple[tuple[str, str, str, str], ...] = (
    ("Pettah_Today_Wholesale", "Manning Market (DOA)", "Colombo", "wholesale"),
    ("Pettah_Today_Retail", "Manning Market (DOA)", "Colombo", "retail"),
    ("Dambulla_Today_Wholesale", "Dambulla Economic Centre (DOA)", "Matale", "wholesale"),
    ("Dambulla_Today_Retail", "Dambulla Economic Centre (DOA)", "Matale", "retail"),
)


def _parse_price(value: object) -> float | None:
    try:
        price = float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return None
    return price if 0 < price < 100_000 else None


def _parse_date(value: object) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.strip()).replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _doa_url(item: str) -> str:
    return f"{DOA_BASE_URL}{DOA_AJAX_PATH}?{urlencode({'action': 'get_veg_data', 'item': item})}"


def parse_doa_item_rows(rows: object, *, item: str) -> list[dict]:
    """Convert DOA chart rows into MarketQuote-compatible dictionaries."""
    if not isinstance(rows, list):
        raise ValueError("DOA response must be a JSON array.")

    quotes: list[dict] = []
    seen: set[tuple[str, str, str, str]] = set()

    for row in rows:
        if not isinstance(row, dict):
            continue

        item_name = str(row.get("Item") or item).strip() or item
        unit = str(row.get("Unit") or "kg").strip().lower() or "kg"
        quoted_at = _parse_date(row.get("Date"))
        if not quoted_at:
            continue

        for field, market_name, district, price_type in PRICE_FIELDS:
            price = _parse_price(row.get(field))
            if price is None:
                continue

            dedup_key = (quoted_at.date().isoformat(), item_name.lower(), market_name, price_type)
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            quotes.append(
                {
                    "district": district,
                    "market_name": market_name,
                    "item_name": item_name,
                    "category": "vegetables",
                    "unit": unit,
                    "price_lkr": price,
                    "source": "doa",
                    "quoted_at": quoted_at.isoformat(),
                    "notes": f"DOA SHEP {price_type} vegetable price.",
                }
            )

    return quotes


def fetch_doa_market_quotes(timeout: float = 30.0, items: tuple[str, ...] = DOA_ITEMS) -> list[dict]:
    """Fetch all configured DOA/SHEP vegetable price series."""
    quotes: list[dict] = []

    with httpx.Client(
        follow_redirects=True,
        timeout=timeout,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; FoodLensBot/1.0)",
            "Referer": DOA_REFERER,
            "Cache-Control": "no-cache",
        },
    ) as client:
        for item in items:
            url = _doa_url(item)
            try:
                response = client.get(url)
                response.raise_for_status()
                item_quotes = parse_doa_item_rows(response.json(), item=item)
                quotes.extend(item_quotes)
                logger.info("DOA: parsed %d quotes for %s", len(item_quotes), item)
            except Exception as exc:
                logger.error("DOA: failed for %s: %s", item, exc)

    logger.info("DOA: parsed %d total market quotes", len(quotes))
    return quotes
