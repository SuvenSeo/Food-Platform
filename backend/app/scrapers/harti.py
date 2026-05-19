"""
HARTI daily food commodities bulletin scraper.

Source page:
  https://www.harti.gov.lk/daily-price.php

HARTI publishes dated English PDFs. The vegetable table contains market columns
for Peliyagoda, Kandy, Dambulla, Meegoda, Norochchole, Thambuththegama,
Keppetipola, Nuwara Eliya, Bandarawela, and Veyangoda.
"""

from __future__ import annotations

import io
import logging
import re
from datetime import datetime, timezone
from urllib.parse import unquote, urljoin

import httpx

logger = logging.getLogger(__name__)

HARTI_DAILY_PRICE_URL = "https://www.harti.gov.lk/daily-price.php"
HARTI_BASE_URL = "https://www.harti.gov.lk"

PDF_LINK_RE = re.compile(r"""href=["']([^"']*assets/pdf/food_price/daily/eng[^"']+\.pdf)["']""", re.IGNORECASE)
PDF_DATE_RE = re.compile(r"(\d{4})[.\-](\d{2})[.\-](\d{2})")

HARTI_MARKET_DISTRICTS: dict[str, str] = {
    "Peliyagoda Market": "Colombo",
    "Kandy Market": "Kandy",
    "Dambulla Market": "Matale",
    "Meegoda Market": "Colombo",
    "Norochchole Market": "Puttalam",
    "Thambuththegama Market": "Anuradhapura",
    "Keppetipola Market": "Badulla",
    "Nuwaraeliya Market": "Nuwara Eliya",
    "Bandarawela Market": "Badulla",
    "Veyangoda Market": "Gampaha",
}

CATEGORY_MARKERS: dict[str, str] = {
    "up country vegetable": "vegetables",
    "low country vegetable": "vegetables",
    "vegetable": "vegetables",
    "banana": "fruits",
    "papaya": "fruits",
    "passion fruit": "fruits",
    "other fruits": "fruits",
    "fruit": "fruits",
}


def _clean_cell(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _find_latest_daily_pdf_url(html: str) -> str | None:
    match = PDF_LINK_RE.search(html)
    if not match:
        return None
    return urljoin(HARTI_BASE_URL, unquote(match.group(1)))


def _quoted_at_from_url(url: str, fallback: datetime | None = None) -> datetime:
    match = PDF_DATE_RE.search(unquote(url))
    if match:
        year, month, day = (int(part) for part in match.groups())
        return datetime(year, month, day, tzinfo=timezone.utc)
    return fallback or datetime.now(timezone.utc)


def _parse_header_date(value: object, fallback: datetime) -> datetime:
    text = _clean_cell(value)
    match = PDF_DATE_RE.search(text)
    if not match:
        return fallback
    year, month, day = (int(part) for part in match.groups())
    return datetime(year, month, day, tzinfo=timezone.utc)


def _parse_price_range(value: object) -> float | None:
    text = _clean_cell(value)
    if not text or text == "-":
        return None

    numbers = [
        float(match.group(0).replace(",", ""))
        for match in re.finditer(r"\d+(?:,\d{3})*(?:\.\d+)?", text)
    ]
    numbers = [number for number in numbers if 0 < number < 100_000]
    if len(numbers) >= 2:
        return round((numbers[0] + numbers[1]) / 2, 2)
    if len(numbers) == 1:
        return round(numbers[0], 2)
    return None


def _category_from_marker(value: str) -> str | None:
    lower = value.lower()
    for marker, category in CATEGORY_MARKERS.items():
        if marker in lower:
            return category
    return None


def _clean_item_name(value: str) -> tuple[str, str]:
    unit = "kg"
    if re.search(r"rs\s*/\s*(fruit|fruits|egg|piece|unit|no)", value, re.IGNORECASE):
        unit = "piece"
    elif re.search(r"rs\s*/\s*l|rs\s*/\s*lit", value, re.IGNORECASE):
        unit = "l"

    clean_name = re.sub(r"\([^)]*rs\s*/[^)]*\)", "", value, flags=re.IGNORECASE)
    clean_name = re.sub(r"\s+", " ", clean_name).strip(" -")
    return clean_name, unit


def _find_market_header_rows(table: list[list[object]]) -> tuple[int, int] | None:
    for index in range(min(4, max(len(table) - 1, 0))):
        first_cell = _clean_cell(table[index][0] if table[index] else "").lower()
        same_row_markets = [_clean_cell(cell) for cell in table[index][1:]]
        if first_cell == "variety" and any(market in HARTI_MARKET_DISTRICTS for market in same_row_markets):
            return max(index - 1, index), index

        next_row_markets = [_clean_cell(cell) for cell in table[index + 1][1:]]
        if first_cell == "variety" and any(market in HARTI_MARKET_DISTRICTS for market in next_row_markets):
            return index, index + 1
    return None


def _parse_harti_price_tables(
    tables: list[list[list[object]]],
    *,
    pdf_url: str,
    fallback_quoted_at: datetime | None = None,
) -> list[dict]:
    fallback = fallback_quoted_at or _quoted_at_from_url(pdf_url)
    quotes: list[dict] = []
    seen: set[tuple[str, str, str, str]] = set()

    for table in tables:
        if len(table) < 3:
            continue

        header_rows = _find_market_header_rows(table)
        if header_rows is None:
            continue

        date_row_index, market_row_index = header_rows
        date_row = table[date_row_index]
        market_row = table[market_row_index]
        markets = [_clean_cell(cell) for cell in market_row[1:]]
        dates = [_parse_header_date(cell, fallback) for cell in date_row[1:]]
        if not any(market in HARTI_MARKET_DISTRICTS for market in markets):
            continue

        current_category = "vegetables"
        for row in table[market_row_index + 1:]:
            if not row:
                continue

            first_cell = _clean_cell(row[0])
            if not first_cell:
                continue

            category = _category_from_marker(first_cell)
            price_cells = row[1:]
            has_prices = any(_parse_price_range(cell) is not None for cell in price_cells)
            if category and not has_prices:
                current_category = category
                continue

            item_name, unit = _clean_item_name(first_cell)
            if not item_name or len(item_name) < 2:
                continue

            for index, raw_price in enumerate(price_cells):
                if index >= len(markets):
                    continue
                market_name = markets[index]
                district = HARTI_MARKET_DISTRICTS.get(market_name)
                if not district:
                    continue
                price = _parse_price_range(raw_price)
                if price is None:
                    continue

                quoted_at = dates[index] if index < len(dates) else fallback
                key = (
                    quoted_at.date().isoformat(),
                    market_name.lower(),
                    item_name.lower(),
                    unit,
                )
                if key in seen:
                    continue
                seen.add(key)

                quotes.append(
                    {
                        "district": district,
                        "market_name": f"{market_name} (HARTI)",
                        "item_name": item_name,
                        "category": current_category,
                        "unit": unit,
                        "price_lkr": price,
                        "source": "harti",
                        "quoted_at": quoted_at.isoformat(),
                        "notes": f"HARTI daily food commodities bulletin range: {_clean_cell(raw_price)}.",
                    }
                )

    return quotes


def _parse_harti_pdf(content: bytes, *, pdf_url: str) -> list[dict]:
    try:
        import pdfplumber  # type: ignore[import-untyped]
    except ImportError:
        logger.warning("HARTI: pdfplumber not installed; cannot parse PDF")
        return []

    tables: list[list[list[object]]] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            tables.extend(page.extract_tables() or [])

    return _parse_harti_price_tables(tables, pdf_url=pdf_url)


def fetch_harti_market_quotes(timeout: float = 30.0) -> list[dict]:
    """Fetch the latest HARTI daily bulletin and return market quote dictionaries."""
    with httpx.Client(
        follow_redirects=True,
        timeout=timeout,
        headers={"User-Agent": "Mozilla/5.0 (compatible; FoodLensBot/1.0)"},
    ) as client:
        index_response = client.get(HARTI_DAILY_PRICE_URL)
        index_response.raise_for_status()

        pdf_url = _find_latest_daily_pdf_url(index_response.text)
        if not pdf_url:
            logger.warning("HARTI: no daily bulletin PDF link found")
            return []

        pdf_response = client.get(pdf_url)
        pdf_response.raise_for_status()
        quotes = _parse_harti_pdf(pdf_response.content, pdf_url=pdf_url)

    logger.info("HARTI: parsed %d market quotes from %s", len(quotes), pdf_url)
    return quotes
