"""
WFP (World Food Programme) / HDX food prices scraper for Sri Lanka.

Data source: https://data.humdata.org/dataset/wfp-food-prices-for-sri-lanka
API docs:    https://data.humdata.org/api/3/action/package_show?id=wfp-food-prices-for-sri-lanka

The WFP VAM food price monitoring CSV covers:
  date, admin1, admin2, market, latitude, longitude,
  category, commodity, unit, currency, price, usdprice

We filter for LKR-denominated rows and map them to our MarketQuote schema.
"""

import csv
import io
import logging
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

HDX_PACKAGE_URL = (
    "https://data.humdata.org/api/3/action/package_show"
    "?id=wfp-food-prices-for-sri-lanka"
)

# Confirmed direct CSV URL from HDX (verified 2026-05-12)
WFP_DIRECT_CSV_URL = (
    "https://data.humdata.org/dataset/0298c598-d312-4771-b564-f4ac4d831f05/"
    "resource/3638f0d6-9969-48cf-a919-1d879d037ec6/download/wfp_food_prices_lka.csv"
)

# WFP category → our platform category
CATEGORY_MAP: dict[str, str] = {
    "cereals and tubers": "rice & grains",
    "oil and fats": "cooking oil",
    "pulses and nuts": "pulses",
    "vegetables and fruits": "vegetables",
    "meat, fish and eggs": "meat & fish",
    "milk and dairy": "dairy",
    "miscellaneous food": "grocery",
    "non-food items": "household",
}


def _get_csv_url(timeout: float) -> str:
    """Resolve latest CSV download URL from HDX API, fall back to direct URL."""
    try:
        response = httpx.get(HDX_PACKAGE_URL, timeout=timeout)
        response.raise_for_status()
        pkg = response.json()
        resources = pkg.get("result", {}).get("resources", [])
        for resource in resources:
            name = resource.get("name", "").lower()
            fmt = resource.get("format", "").upper()
            if fmt == "CSV" or name.endswith(".csv"):
                url = resource.get("url") or resource.get("download_url", "")
                if url:
                    logger.info("WFP: resolved CSV URL from HDX API: %s", url)
                    return url
    except Exception as exc:
        logger.warning("WFP: HDX API lookup failed (%s), using direct URL", exc)

    return WFP_DIRECT_CSV_URL


def fetch_wfp_market_quotes(timeout: float = 45.0, max_rows: int = 3000, months_back: int = 24) -> list[dict]:
    """
    Fetch and parse WFP food price data for Sri Lanka.

    Returns a list of dicts compatible with MarketQuoteRecord:
    district, market_name, item_name, category, unit, price_lkr, source, quoted_at, notes

    Only returns rows from the last `months_back` months to keep the dataset current.
    """
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(days=months_back * 30)

    csv_url = _get_csv_url(timeout)

    with httpx.Client(follow_redirects=True, timeout=timeout) as client:
        response = client.get(csv_url)
        response.raise_for_status()

    text = response.text
    reader = csv.DictReader(io.StringIO(text))

    quotes: list[dict] = []
    seen: set[tuple] = set()  # dedup by (date, market, commodity, unit)

    for row in reader:
        if len(quotes) >= max_rows:
            break

        currency = (row.get("currency") or row.get("Currency") or "").strip().upper()
        if currency and currency != "LKR":
            continue

        try:
            price_raw = row.get("price") or row.get("Price") or ""
            price = float(price_raw)
        except (TypeError, ValueError):
            continue

        if price <= 0:
            continue

        date_raw = (row.get("date") or row.get("Date") or "").strip()
        if not date_raw:
            continue
        try:
            # ISO date or "YYYY-MM-DD" or "MM/DD/YYYY"
            if "/" in date_raw:
                parts = date_raw.split("/")
                if len(parts) == 3:
                    date_raw = f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"
            quoted_at = datetime.fromisoformat(date_raw).replace(tzinfo=timezone.utc)
        except ValueError:
            continue

        # Only include recent data
        if quoted_at < cutoff:
            continue

        market = (row.get("market") or row.get("Market") or "").strip()
        district = (row.get("admin2") or row.get("Admin2") or "").strip()
        if not district:
            district = (row.get("admin1") or row.get("Admin1") or "Colombo").strip()
        commodity = (row.get("commodity") or row.get("Commodity") or "").strip()
        unit = (row.get("unit") or row.get("Unit") or "kg").strip().lower()
        raw_cat = (row.get("category") or row.get("Category") or "").strip().lower()
        category = CATEGORY_MAP.get(raw_cat, raw_cat or "grocery")

        if not market or not commodity:
            continue

        dedup_key = (str(quoted_at.date()), market, commodity, unit)
        if dedup_key in seen:
            continue
        seen.add(dedup_key)

        quotes.append({
            "district": district,
            "market_name": market,
            "item_name": commodity,
            "category": category,
            "unit": unit,
            "price_lkr": price,
            "source": "wfp",
            "quoted_at": quoted_at.isoformat(),
            "notes": f"WFP VAM price monitoring. Admin: {district}",
        })

    logger.info("WFP: parsed %d market quotes from %s", len(quotes), csv_url)
    return quotes
