"""
Keells Super scraper — keells.com

Keells is Sri Lanka's largest supermarket chain under John Keells Holdings.

Their online store (https://www.keells.com) is a custom Next.js/React application
and does not expose a Shopify /products.json endpoint. We scrape their HTML
category listing pages to extract product names, prices, and images.

Alternative: keellssuper.com (older domain) may also have product data.
"""

import re
import logging

import httpx
from bs4 import BeautifulSoup

from app.schemas.domain import RawOffer

logger = logging.getLogger(__name__)

KEELLS_BASE_URL = "https://www.keells.com"

# Category page paths to scrape
KEELLS_CATEGORY_PAGES = [
    ("Rice & Grains", "/product-category/rice-and-grains"),
    ("Grocery", "/product-category/grocery"),
    ("Dairy", "/product-category/dairy"),
    ("Beverages", "/product-category/beverages"),
    ("Biscuits & Snacks", "/product-category/biscuits-and-snacks"),
    ("Cooking Oil", "/product-category/oil-and-ghee"),
    ("Household", "/product-category/household"),
    ("Personal Care", "/product-category/personal-care"),
]

# Also try the supermarket listing page
KEELLS_LISTING_PAGES = [
    ("Grocery", f"{KEELLS_BASE_URL}/supermarket"),
    ("Grocery", f"{KEELLS_BASE_URL}/grocery"),
]


def _parse_price(text: str) -> float | None:
    """Extract LKR price from text like 'Rs. 250.00' or '250'."""
    m = re.search(r"(?:Rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d+)?)", text)
    if m:
        try:
            val = float(m.group(1).replace(",", ""))
            return val if 5 < val < 100_000 else None
        except ValueError:
            return None
    return None


def _parse_page(html: str, category: str, base_url: str) -> list[RawOffer]:
    """Parse a Keells product listing page."""
    soup = BeautifulSoup(html, "lxml")
    offers: list[RawOffer] = []

    # Try common product card selectors
    product_els = soup.select(
        ".product, .product-card, .product-item, [class*='product'], "
        "article.woocommerce-loop-product"
    )

    if not product_els:
        # Fallback: data-product-id elements
        product_els = soup.find_all(attrs={"data-product-id": True})

    for el in product_els:
        # Title
        title_tag = el.select_one(
            ".woocommerce-loop-product__title, .product-title, h2, h3, h4, "
            "[class*='title'], [class*='name']"
        )
        if not title_tag:
            continue
        title = title_tag.get_text(strip=True)
        if not title or len(title) < 2:
            continue

        # Price
        price_tag = el.select_one(
            ".price, .woocommerce-Price-amount, [class*='price'], [class*='cost']"
        )
        price_text = price_tag.get_text(strip=True) if price_tag else el.get_text(" ", strip=True)
        price = _parse_price(price_text)
        if not price:
            continue

        # URL
        link_tag = el.select_one("a[href]")
        href = str(link_tag.get("href", "")) if link_tag else ""
        if not href:
            continue
        if not href.startswith("http"):
            href = f"{base_url.rstrip('/')}{href}"

        # Item ID from URL slug
        slug_m = re.search(r"/([^/?#]+)/?$", href)
        item_id = slug_m.group(1) if slug_m else href[-32:]

        # Image
        img_tag = el.select_one("img")
        image_url: str | None = None
        if img_tag:
            src = (
                img_tag.get("data-src")
                or img_tag.get("data-lazy-src")
                or img_tag.get("src")
                or ""
            )
            if src and "placeholder" not in src and "logo" not in src.lower():
                if src.startswith("//"):
                    src = f"https:{src}"
                elif src.startswith("/"):
                    src = f"{base_url}{src}"
                image_url = src or None

        offers.append(
            RawOffer(
                source="keells",
                source_item_id=item_id,
                source_group_id=item_id,
                category=category,
                title=title,
                variant_title=None,
                price_lkr=price,
                currency="LKR",
                available=True,
                sku=None,
                url=href,
                image_url=image_url,
            )
        )

    return offers


def fetch_keells_catalog(max_items: int, user_agent: str) -> list[RawOffer]:
    """
    Scrape Keells Super product category pages.

    Keells uses a custom React app so we scrape HTML listings.
    """
    offers: list[RawOffer] = []
    seen_ids: set[str] = set()

    ua = user_agent or "Mozilla/5.0 (compatible; FoodLensBot/1.0)"

    with httpx.Client(
        headers={"User-Agent": ua, "Accept": "text/html,application/xhtml+xml"},
        follow_redirects=True,
        timeout=30.0,
    ) as client:
        # Try category pages
        pages_to_try = [(cat, f"{KEELLS_BASE_URL}{path}") for cat, path in KEELLS_CATEGORY_PAGES]
        pages_to_try += KEELLS_LISTING_PAGES

        for category, url in pages_to_try:
            if len(offers) >= max_items:
                break
            try:
                resp = client.get(url)
                if resp.status_code in (404, 410):
                    continue
                resp.raise_for_status()
                page_offers = _parse_page(resp.text, category, KEELLS_BASE_URL)
                for o in page_offers:
                    if o.source_item_id not in seen_ids:
                        seen_ids.add(o.source_item_id)
                        offers.append(o)
                logger.info("Keells: %s → %d offers (total %d)", url, len(page_offers), len(offers))
            except httpx.HTTPStatusError as exc:
                logger.warning("Keells: HTTP %s for %s", exc.response.status_code, url)
            except Exception as exc:
                logger.warning("Keells: failed for %s: %s", url, exc)
                continue

    logger.info("Keells: scraped %d total offers", len(offers))
    return offers[:max_items]
