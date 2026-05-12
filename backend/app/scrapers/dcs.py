"""
DCS (Department of Census and Statistics, Sri Lanka) weekly retail price scraper.

Data source:
  https://www.statistics.gov.lk/InflationAndPrices/StaticalInformation/RetailPrices

The DCS publishes weekly Excel files with retail prices of selected consumer
items for the Colombo District. We:
  1. Scrape the index page to find the most recent weekly report link.
  2. Download the Excel file.
  3. Parse item names and prices into MarketQuote records.

Typical items in the DCS weekly report:
  Big Onion (1kg), Green Gram (1kg), Red Lentils (1kg), Sugar (1kg),
  Wheat Flour (1kg), Red Nadu Rice (1kg), Basmati Rice (1kg),
  Dried Fish (1kg), Coconut (piece), Potatoes (1kg), Tomato (1kg),
  Leeks (1kg), Green Chillies (1kg), etc.

Excel format varies by year but is generally a two-column table:
  Column A: item name / description
  Column B: price (LKR)
"""

import io
import logging
import re
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

DCS_INDEX_URL = (
    "https://www.statistics.gov.lk/InflationAndPrices/StaticalInformation/RetailPrices"
)
DCS_BASE_URL = "https://www.statistics.gov.lk"
DCS_RESOURCE_BASE = "https://www.statistics.gov.lk/Resource/en/InflationAndPrices/RetailPrices"

# Month name mapping for DCS filename patterns
MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April",
    5: "May", 6: "June", 7: "July", 8: "August",
    9: "September", 10: "October", 11: "November", 12: "December",
}
WEEK_SUFFIXES = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th"}


def _current_week_of_month(day: int) -> int:
    """Rough week-of-month: 1–7 → 1, 8–14 → 2, 15–21 → 3, 22+ → 4."""
    return min((day - 1) // 7 + 1, 4)


def _dcs_candidate_urls() -> list[str]:
    """
    Generate a list of candidate DCS Excel file URLs for the current and previous weeks.
    DCS uses the pattern:
      RetailPrices{N}weekMMMYYYY.xlsx  or  Retailprices{N}stweekMMMYYYY.xlsx
    """
    from datetime import date, timedelta
    urls: list[str] = []

    today = date.today()
    # Try current week and 3 prior weeks
    for weeks_back in range(4):
        check_date = today - timedelta(weeks=weeks_back)
        week_num = _current_week_of_month(check_date.day)
        month = MONTH_NAMES[check_date.month]
        year = check_date.year
        suffix = WEEK_SUFFIXES.get(week_num, "1st")

        # Try multiple filename capitalisation variants observed on DCS
        stems = [
            f"RetailPrices{suffix}week{month}{year}",
            f"Retailprices{suffix}week{month}{year}",
            f"RetailPrice{suffix}week{month}{year}",
            f"retailprices{suffix}week{month}{year}",
        ]
        for stem in stems:
            urls.append(f"{DCS_RESOURCE_BASE}/{stem}.xlsx")
            urls.append(f"{DCS_RESOURCE_BASE}/{stem}.xls")

    return urls

# Items we recognize from DCS reports and their platform categories
DCS_ITEM_CATEGORIES: dict[str, str] = {
    "rice": "rice & grains",
    "flour": "rice & grains",
    "grain": "rice & grains",
    "lentil": "pulses",
    "dhal": "pulses",
    "green gram": "pulses",
    "gram": "pulses",
    "chickpea": "pulses",
    "black gram": "pulses",
    "onion": "vegetables",
    "potato": "vegetables",
    "tomato": "vegetables",
    "leek": "vegetables",
    "chilli": "vegetables",
    "carrot": "vegetables",
    "garlic": "vegetables",
    "coconut": "vegetables",
    "sugar": "grocery",
    "milk": "dairy",
    "eggs": "meat & fish",
    "fish": "meat & fish",
    "dried fish": "meat & fish",
    "oil": "cooking oil",
    "bread": "bakery",
}


def _infer_category(item_name: str) -> str:
    lower = item_name.lower()
    for keyword, category in DCS_ITEM_CATEGORIES.items():
        if keyword in lower:
            return category
    return "grocery"


def _find_latest_excel_url(html: str) -> str | None:
    """Find the first Excel/PDF file link on the DCS retail prices index page."""
    soup = BeautifulSoup(html, "lxml")

    # Look for links ending in .xlsx, .xls, or .pdf (in order of preference)
    for ext in (".xlsx", ".xls", ".pdf"):
        for link in soup.find_all("a", href=True):
            href = str(link["href"])
            if ext in href.lower():
                if href.startswith("http"):
                    return href
                if href.startswith("/"):
                    return f"{DCS_BASE_URL}{href}"
    return None


def _parse_dcs_excel(content: bytes, quoted_at: datetime) -> list[dict]:
    """Parse a DCS weekly retail price Excel file."""
    try:
        import openpyxl  # type: ignore[import-untyped]
    except ImportError:
        logger.warning("DCS: openpyxl not installed; cannot parse Excel files")
        return []

    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    quotes: list[dict] = []

    for sheet in wb.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        for row in rows:
            if len(row) < 2:
                continue

            # Find item name (str) and price (numeric) in the row
            item_name: str | None = None
            price: float | None = None

            for cell in row:
                if isinstance(cell, str) and len(cell.strip()) > 2:
                    item_name = cell.strip()
                elif isinstance(cell, (int, float)) and cell > 0:
                    price = float(cell)

            if not item_name or not price:
                continue

            # Skip header/title rows
            if re.search(r"item|description|commodity|week|month|price|rs\.|lkr", item_name, re.IGNORECASE):
                continue
            if price < 5 or price > 100_000:
                continue

            category = _infer_category(item_name)

            # Extract unit from item name if present (e.g., "Big Onion (1kg)" → "kg")
            unit = "kg"
            unit_match = re.search(r"\((\d+(?:\.\d+)?)\s*(kg|g|l|ml|unit|piece|pcs)\)", item_name, re.IGNORECASE)
            if unit_match:
                unit = unit_match.group(2).lower()

            # Clean item name
            clean_name = re.sub(r"\(.*?\)", "", item_name).strip(" ,.-")

            quotes.append({
                "district": "Colombo",
                "market_name": "Colombo District (DCS)",
                "item_name": clean_name,
                "category": category,
                "unit": unit,
                "price_lkr": price,
                "source": "dcs",
                "quoted_at": quoted_at.isoformat(),
                "notes": "DCS weekly retail price survey, Colombo District.",
            })

    return quotes


def fetch_dcs_market_quotes(timeout: float = 30.0) -> list[dict]:
    """
    Download the DCS weekly retail prices Excel file and return market quote dicts.

    Strategy:
    1. Try dynamically constructed URL candidates for current/recent weeks.
    2. Fall back to scraping the index page for file links (works if DCS ever
       adds static links).
    """
    quoted_at = datetime.now(timezone.utc)

    with httpx.Client(
        follow_redirects=True,
        timeout=timeout,
        headers={"User-Agent": "Mozilla/5.0 (compatible; FoodLensBot/1.0)"},
    ) as client:
        # 1. Try date-based candidate URLs
        for url in _dcs_candidate_urls():
            try:
                resp = client.get(url)
                content = resp.content
                # DCS returns HTML "page not found" as a 200 — detect by content-type and size
                content_type = resp.headers.get("content-type", "").lower()
                is_real_file = (
                    resp.status_code == 200
                    and len(content) > 4096  # real Excel files are >4KB
                    and "html" not in content_type
                    and not content.startswith(b"page not")  # "page not found pls check URL"
                )
                if is_real_file:
                    logger.info("DCS: found report at %s (%d bytes)", url, len(content))
                    quotes = _parse_dcs_excel(content, quoted_at)
                    if quotes:
                        logger.info("DCS: parsed %d market quotes", len(quotes))
                        return quotes
            except Exception:
                continue

        # 2. Fall back to scraping the index page
        logger.info("DCS: date-based URLs failed; trying index page scrape")
        try:
            index_r = client.get(DCS_INDEX_URL)
            index_r.raise_for_status()
        except Exception as exc:
            logger.error("DCS: index page failed: %s", exc)
            return []

        excel_url = _find_latest_excel_url(index_r.text)
        if not excel_url:
            logger.warning("DCS: no file link found on index page (JS rendering may be required)")
            return []

        try:
            file_r = client.get(excel_url)
            file_r.raise_for_status()
        except Exception as exc:
            logger.error("DCS: file download failed: %s", exc)
            return []

    quotes = _parse_dcs_excel(file_r.content, quoted_at)
    logger.info("DCS: parsed %d market quotes from index", len(quotes))
    return quotes
