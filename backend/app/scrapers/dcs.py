"""
DCS (Department of Census and Statistics, Sri Lanka) weekly retail price scraper.

Data source:
  https://www.statistics.gov.lk/InflationAndPrices/StaticalInformation/RetailPrices

The DCS currently publishes weekly PDF reports with retail prices of selected
consumer items for the Colombo District. Older archives include Excel files. We:
  1. Scrape the index page to find the most recent weekly report link.
  2. Resolve the report wrapper to its PDF/Excel resource.
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
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

DCS_INDEX_URL = (
    "https://www.statistics.gov.lk/InflationAndPrices/StaticalInformation/RetailPrices"
)
DCS_BASE_URL = "https://www.statistics.gov.lk"
DCS_RESOURCE_BASE = "https://www.statistics.gov.lk/Resource/en/InflationAndPrices/retail"

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
    Generate current/recent DCS weekly report candidates.

    Recent DCS reports use:
      /InflationAndPrices/StaticalInformation/retail/DCSB-WRP-YYYY-MM-WN
      /Resource/en/InflationAndPrices/retail/DCSB-WRP-YYYY-MM-WN.pdf

    Older Excel file patterns are retained as a fallback.
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
        month_number = f"{check_date.month:02d}"

        report_stem = f"DCSB-WRP-{year}-{month_number}-W{week_num}"
        urls.append(f"{DCS_BASE_URL}/InflationAndPrices/StaticalInformation/retail/{report_stem}")
        urls.append(f"{DCS_RESOURCE_BASE}/{report_stem}.pdf")

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
    "plantain": "vegetables",
    "pumpkin": "vegetables",
    "bandakka": "vegetables",
    "brinjal": "vegetables",
    "bitter guard": "vegetables",
    "bitter gourd": "vegetables",
    "cucumber": "vegetables",
    "gourd": "vegetables",
    "capsicum": "vegetables",
    "vetakolu": "vegetables",
    "lime": "fruits",
    "gotukola": "vegetables",
    "kankun": "vegetables",
    "kohila": "vegetables",
    "murunga": "vegetables",
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


def _find_latest_report_url(html: str) -> str | None:
    """Find the first current weekly report link on the DCS retail prices index page."""
    soup = BeautifulSoup(html, "lxml")

    for link in soup.find_all("a", href=True):
        href = str(link["href"]).strip()
        lower = href.lower()
        if "dcsb-wrp" in lower or lower.endswith((".xlsx", ".xls", ".pdf")):
            return urljoin(DCS_BASE_URL, href)
    return None


def _quoted_at_from_url(url: str, fallback: datetime) -> datetime:
    match = re.search(r"DCSB-WRP-(\d{4})-(\d{2})-W(\d)", url, re.IGNORECASE)
    if not match:
        return fallback
    year = int(match.group(1))
    month = int(match.group(2))
    week = int(match.group(3))
    day = min(max(week, 1) * 7, 28)
    return datetime(year, month, day, tzinfo=timezone.utc)


def _normalize_unit(raw_unit: object) -> str:
    value = re.sub(r"\s+", " ", str(raw_unit or "")).strip().lower().rstrip(".")
    if "kg" in value:
        return "kg"
    if value in {"bunch", "bundle"}:
        return value
    if value in {"no", "nos", "unit", "piece", "pieces", "each"}:
        return "piece"
    if "lit" in value or value in {"l", "ltr"}:
        return "l"
    return value or "kg"


def _numbers_from_cell(value: object) -> list[float]:
    return [
        float(match.group(1).replace(",", ""))
        for match in re.finditer(r"(-?\d+(?:,\d{3})*(?:\.\d+)?)", str(value or ""))
    ]


def _current_price_from_average_cell(value: object) -> float | None:
    numbers = [number for number in _numbers_from_cell(value) if number > 0]
    if len(numbers) >= 3:
        return numbers[2]
    if numbers:
        return numbers[-1]
    return None


def _parse_dcs_table_rows(rows: list[list[object]], quoted_at: datetime) -> list[dict]:
    quotes: list[dict] = []

    for row in rows:
        if len(row) < 3:
            continue
        item_name = str(row[0] or "").strip()
        if not item_name or len(item_name) < 2:
            continue
        if re.search(r"item|avg\.?price|price range|main markets|open market", item_name, re.IGNORECASE):
            continue

        price = _current_price_from_average_cell(row[2])
        if not price or price < 5 or price > 100_000:
            continue

        quotes.append({
            "district": "Colombo",
            "market_name": "Colombo District (DCS)",
            "item_name": re.sub(r"\s+", " ", item_name).strip(" ,.-"),
            "category": _infer_category(item_name),
            "unit": _normalize_unit(row[1] if len(row) > 1 else None),
            "price_lkr": price,
            "source": "dcs",
            "quoted_at": quoted_at.isoformat(),
            "notes": "DCS weekly open market retail price survey, Colombo District.",
        })

    return quotes


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


def _parse_dcs_pdf(content: bytes, quoted_at: datetime) -> list[dict]:
    """Parse the current DCS weekly retail price PDF format."""
    try:
        import pdfplumber  # type: ignore[import-untyped]
    except ImportError:
        logger.warning("DCS: pdfplumber not installed; cannot parse PDF files")
        return []

    quotes: list[dict] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables() or []:
                quotes.extend(_parse_dcs_table_rows(table, quoted_at))
    return quotes


def _resolve_report_file(client: httpx.Client, url: str) -> tuple[bytes, str, str] | None:
    response = client.get(url)
    if response.status_code != 200:
        return None

    content_type = response.headers.get("content-type", "").lower()
    content = response.content
    final_url = str(response.url)
    if len(content) > 4096 and "html" not in content_type:
        return content, content_type, final_url

    soup = BeautifulSoup(response.text, "lxml")
    for tag_name, attr in (("iframe", "src"), ("a", "href")):
        for tag in soup.find_all(tag_name):
            raw = tag.get(attr)
            if not raw:
                continue
            candidate_url = urljoin(final_url, str(raw).strip())
            if candidate_url.lower().endswith((".pdf", ".xlsx", ".xls")):
                file_response = client.get(candidate_url)
                if file_response.status_code == 200 and len(file_response.content) > 4096:
                    return (
                        file_response.content,
                        file_response.headers.get("content-type", "").lower(),
                        str(file_response.url),
                    )

    return None


def _parse_report_content(content: bytes, content_type: str, url: str, fallback_quoted_at: datetime) -> list[dict]:
    quoted_at = _quoted_at_from_url(url, fallback_quoted_at)
    lower_url = url.lower()
    if ".pdf" in lower_url or "pdf" in content_type:
        return _parse_dcs_pdf(content, quoted_at)
    return _parse_dcs_excel(content, quoted_at)


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
                resolved = _resolve_report_file(client, url)
                if resolved:
                    content, content_type, final_url = resolved
                    logger.info("DCS: found report at %s (%d bytes)", final_url, len(content))
                    quotes = _parse_report_content(content, content_type, final_url, quoted_at)
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

        report_url = _find_latest_report_url(index_r.text)
        if not report_url:
            logger.warning("DCS: no file link found on index page (JS rendering may be required)")
            return []

        resolved = _resolve_report_file(client, report_url)
        if not resolved:
            logger.error("DCS: report download failed for %s", report_url)
            return []

    content, content_type, final_url = resolved
    quotes = _parse_report_content(content, content_type, final_url, quoted_at)
    logger.info("DCS: parsed %d market quotes from index", len(quotes))
    return quotes
