"""
CBSL (Central Bank of Sri Lanka) daily price report scraper.

Data source: https://www.cbsl.gov.lk/en/statistics/economic-indicators/price-report

PDF URL pattern: https://www.cbsl.gov.lk/sites/default/files/cbslweb_documents/
                 statistics/pricerpt/price_report_YYYYMMDD_e.pdf

The report covers selected food commodities across Pettah, Dambulla, and
Narahenpita markets with wholesale and retail prices.

Page 2 table structure (10 price columns per item):
  0: Wholesale Pettah Last Friday
  1: Wholesale Pettah Today        ← "today" row
  2: Wholesale Dambulla Last Friday
  3: Wholesale Dambulla Today
  4: Retail Pettah Last Friday
  5: Retail Pettah Today           ← we use this as primary
  6: Retail Dambulla Last Friday
  7: Retail Dambulla Today
  8: Retail Narahenpita Last Friday
  9: Retail Narahenpita Today
"""

import io
import logging
import re
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

CBSL_INDEX_URL = "https://www.cbsl.gov.lk/en/statistics/economic-indicators/price-report"
CBSL_BASE_URL = "https://www.cbsl.gov.lk"

# Known section headers to skip
SECTION_HEADERS = {"VEGETABLES", "FISH", "OTHER FOOD ITEMS", "DRIED FISH", "FRESH FISH", "GRAINS"}

ITEM_CATEGORIES: dict[str, str] = {
    "beans": "vegetables", "carrot": "vegetables", "leeks": "vegetables",
    "tomato": "vegetables", "capsicum": "vegetables", "bitter gourd": "vegetables",
    "ash plantain": "vegetables", "potato": "vegetables", "cabbage": "vegetables",
    "onion": "vegetables", "garlic": "vegetables", "red onion": "vegetables",
    "big onion": "vegetables", "green chilli": "vegetables",
    "coconut": "vegetables", "banana": "vegetables",
    "sprats": "meat & fish", "dried fish": "meat & fish", "fish": "meat & fish",
    "mackerel": "meat & fish", "seer": "meat & fish",
    "rice": "rice & grains", "flour": "rice & grains", "bread": "bakery",
    "sugar": "grocery", "salt": "grocery", "lentil": "pulses",
    "dhal": "pulses", "green gram": "pulses", "gram": "pulses",
    "milk": "dairy", "egg": "meat & fish", "coconut oil": "cooking oil",
    "vegetable oil": "cooking oil",
}


def _infer_category(item: str) -> str:
    lower = item.lower()
    for kw, cat in ITEM_CATEGORIES.items():
        if kw in lower:
            return cat
    return "grocery"


def _clean_price(raw: str) -> float | None:
    """
    Handle CBSL PDF price artefacts: '5 00.00' → 500.0, '1 80.00' → 180.0
    Plain numbers like '450.00' also work.
    """
    # Remove non-digit/dot/space chars
    s = re.sub(r"[^\d.\s]", "", raw).strip()
    if not s:
        return None

    # Join broken numbers: '5 00.00' → '500.00'
    parts = s.split()
    joined = "".join(parts)
    try:
        val = float(joined)
        return val if 5 < val < 100_000 else None
    except ValueError:
        pass

    # Fallback: find first standalone float
    m = re.search(r"\d+(?:\.\d+)?", s)
    if m:
        try:
            val = float(m.group())
            return val if 5 < val < 100_000 else None
        except ValueError:
            pass
    return None


def _find_latest_pdf_url(html: str) -> tuple[str | None, datetime | None]:
    """Return (pdf_url, quoted_at) for the most recent Daily Price Report."""
    soup = BeautifulSoup(html, "lxml")

    # Report links are under /sites/default/files/cbslweb_documents/statistics/pricerpt/
    for a in soup.find_all("a", href=True):
        href = str(a["href"])
        if "pricerpt" in href and (href.endswith(".pdf") or "price_report" in href):
            full_url = href if href.startswith("http") else f"{CBSL_BASE_URL}{href}"

            # Try to extract date from href: price_report_YYYYMMDD_e.pdf
            date_m = re.search(r"price_report_(\d{8})", href)
            quoted_at: datetime | None = None
            if date_m:
                try:
                    quoted_at = datetime.strptime(date_m.group(1), "%Y%m%d").replace(
                        tzinfo=timezone.utc
                    )
                except ValueError:
                    pass

            return full_url, quoted_at

    return None, None


def _parse_cbsl_pdf(content: bytes, quoted_at: datetime) -> list[dict]:
    """Parse CBSL Daily Price Report PDF and extract today's retail prices."""
    try:
        import pdfplumber  # type: ignore[import-untyped]
    except ImportError:
        logger.warning("CBSL: install pdfplumber to parse PDF reports: pip install pdfplumber")
        return []

    quotes: list[dict] = []

    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            # Page 2 (index 1) has the commodity price table
            target_pages = pdf.pages[1:] if len(pdf.pages) >= 2 else pdf.pages

            for page in target_pages:
                text = page.extract_text() or ""
                lines = text.splitlines()

                for line in lines:
                    # Skip empty lines, headers, notes
                    line = line.strip()
                    if not line:
                        continue
                    upper = line.upper()
                    if any(h in upper for h in SECTION_HEADERS):
                        continue
                    if re.match(r"^(Wholesale|Retail|Item|Unit|Pettah|Dambulla|Narah|Last|Today|08\.|09\.|10\.|11\.|12\.)", line):
                        continue
                    # Skip header / report-title rows. The month/year part is
                    # generic (any "Month YYYY" run inside the line) so this
                    # filter does NOT need updating each calendar month.
                    if re.search(
                        r"Price Report|Commodities|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b",
                        line,
                    ):
                        continue

                    # Expect: "Item name Rs./kg [10 prices]"
                    # Match item name at start, followed by Rs./kg unit, then numbers
                    m = re.match(
                        r"^([A-Za-z\s\(\)\/\-]+?)\s+(Rs\./(?:kg|unit|pcs|g|litre|ltr|100g))\s+(.+)$",
                        line,
                        re.IGNORECASE,
                    )
                    if not m:
                        continue

                    item_name = m.group(1).strip()
                    unit_raw = m.group(2).strip()
                    prices_raw = m.group(3).strip()

                    if len(item_name) < 2 or len(item_name) > 40:
                        continue

                    # Extract all price tokens (digit blocks)
                    price_tokens = re.findall(r"\d+(?:\s+\d+)*(?:\.\d+)?", prices_raw)
                    if not price_tokens:
                        continue

                    # Retail Pettah Today = index 5 in the 10-column layout
                    # Retail Pettah Last Friday = index 4
                    # We take index 5 (today's Pettah retail) as primary
                    def get_price(tokens: list[str], idx: int) -> float | None:
                        if idx >= len(tokens):
                            return None
                        return _clean_price(tokens[idx])

                    # Build per-market quotes
                    markets = [
                        ("Pettah", 5),
                        ("Dambulla", 7),
                        ("Narahenpita", 9),
                    ]

                    for market_name, price_idx in markets:
                        price = get_price(price_tokens, price_idx)
                        if price is None:
                            # Try the last resort: just pick first available price
                            for tok in price_tokens:
                                price = _clean_price(tok)
                                if price:
                                    break

                        if not price:
                            continue

                        quotes.append({
                            "district": "Colombo" if market_name != "Dambulla" else "Kandy",
                            "market_name": f"{market_name} Market (CBSL)",
                            "item_name": item_name,
                            "category": _infer_category(item_name),
                            "unit": unit_raw.replace("Rs./", ""),
                            "price_lkr": price,
                            "source": "cbsl",
                            "quoted_at": quoted_at.isoformat(),
                            "notes": f"CBSL Daily Price Report {quoted_at.strftime('%d %b %Y')}.",
                        })
                        break  # one per item (Pettah retail as primary)

    except Exception as exc:
        logger.error("CBSL: PDF parsing error: %s", exc)

    return quotes


def fetch_cbsl_market_quotes(timeout: float = 30.0) -> list[dict]:
    """Fetch and parse the latest CBSL Daily Price Report PDF."""
    with httpx.Client(follow_redirects=True, timeout=timeout,
                      headers={"User-Agent": "Mozilla/5.0 (compatible; FoodLensBot/1.0)"}) as client:
        try:
            index_r = client.get(CBSL_INDEX_URL)
            index_r.raise_for_status()
        except Exception as exc:
            logger.error("CBSL: index page failed: %s", exc)
            return []

        pdf_url, quoted_at = _find_latest_pdf_url(index_r.text)
        if not pdf_url:
            logger.warning("CBSL: no price report PDF link found")
            return []

        quoted_at = quoted_at or datetime.now(timezone.utc)
        logger.info("CBSL: downloading %s (date %s)", pdf_url, quoted_at.date())

        try:
            pdf_r = client.get(pdf_url)
            pdf_r.raise_for_status()
        except Exception as exc:
            logger.error("CBSL: PDF download failed: %s", exc)
            return []

    quotes = _parse_cbsl_pdf(pdf_r.content, quoted_at)
    logger.info("CBSL: extracted %d market quotes from %s", len(quotes), pdf_url)
    return quotes
