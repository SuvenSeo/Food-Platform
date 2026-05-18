"""
Keells Super scraper — keells.com

Uses headless Chromium (Playwright) because the storefront is a JS SPA.
"""

from __future__ import annotations

import logging
import re

from bs4 import BeautifulSoup

from app.schemas.domain import RawOffer
from app.scrapers.browser import fetch_rendered_html

logger = logging.getLogger(__name__)

KEELLS_BASE_URL = "https://www.keells.com"

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

KEELLS_LISTING_PAGES = [
    ("Grocery", f"{KEELLS_BASE_URL}/supermarket"),
    ("Grocery", f"{KEELLS_BASE_URL}/grocery"),
]

PRODUCT_CARD_SELECTOR = (
    ".product, .product-card, .product-item, article.woocommerce-loop-product, "
    "[class*='product-card'], [data-product-id]"
)


def _parse_price(text: str) -> float | None:
    match = re.search(r"(?:Rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d+)?)", text)
    if not match:
        return None
    try:
        value = float(match.group(1).replace(",", ""))
        return value if 5 < value < 100_000 else None
    except ValueError:
        return None


def parse_keells_page(html: str, category: str, base_url: str = KEELLS_BASE_URL) -> list[RawOffer]:
    """Parse a Keells product listing page from rendered HTML."""
    soup = BeautifulSoup(html, "lxml")
    offers: list[RawOffer] = []

    product_els = soup.select(PRODUCT_CARD_SELECTOR)
    if not product_els:
        product_els = soup.find_all(attrs={"data-product-id": True})

    for element in product_els:
        title_tag = element.select_one(
            ".woocommerce-loop-product__title, .product-title, h2, h3, h4, "
            "[class*='title'], [class*='name']"
        )
        if not title_tag:
            continue
        title = title_tag.get_text(strip=True)
        if not title or len(title) < 2:
            continue

        price_tag = element.select_one(
            ".price, .woocommerce-Price-amount, [class*='price'], [class*='cost']"
        )
        price_text = price_tag.get_text(strip=True) if price_tag else element.get_text(" ", strip=True)
        price = _parse_price(price_text)
        if not price:
            continue

        link_tag = element.select_one("a[href]")
        href = str(link_tag.get("href", "")) if link_tag else ""
        if not href:
            continue
        if not href.startswith("http"):
            href = f"{base_url.rstrip('/')}{href}"

        slug_match = re.search(r"/([^/?#]+)/?$", href)
        item_id = slug_match.group(1) if slug_match else href[-32:]

        image_url: str | None = None
        img_tag = element.select_one("img")
        if img_tag:
            src = img_tag.get("data-src") or img_tag.get("data-lazy-src") or img_tag.get("src") or ""
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
    offers: list[RawOffer] = []
    seen_ids: set[str] = set()
    ua = user_agent or "Mozilla/5.0 (compatible; FoodPlatformBot/1.0)"

    pages_to_try = [(cat, f"{KEELLS_BASE_URL}{path}") for cat, path in KEELLS_CATEGORY_PAGES]
    pages_to_try += KEELLS_LISTING_PAGES

    for category, url in pages_to_try:
        if len(offers) >= max_items:
            break
        try:
            html = fetch_rendered_html(url, user_agent=ua, wait_selector=PRODUCT_CARD_SELECTOR)
            page_offers = parse_keells_page(html, category)
            for offer in page_offers:
                if offer.source_item_id not in seen_ids:
                    seen_ids.add(offer.source_item_id)
                    offers.append(offer)
            logger.info("Keells: %s → %d offers (total %d)", url, len(page_offers), len(offers))
        except Exception as exc:
            logger.warning("Keells: failed for %s: %s", url, exc)
            continue

    logger.info("Keells: scraped %d total offers", len(offers))
    return offers[:max_items]
