"""
Cargills Food City scraper — cargillsceylon.com

Uses headless Chromium (Playwright) for JS-rendered category listings.
"""

from __future__ import annotations

import logging
import re

from bs4 import BeautifulSoup

from app.schemas.domain import RawOffer
from app.scrapers.browser import fetch_rendered_html

logger = logging.getLogger(__name__)

CARGILLS_BASE_URL = "https://www.cargillsceylon.com"

CARGILLS_CATEGORY_PAGES = [
    ("Rice & Grains", f"{CARGILLS_BASE_URL}/product-category/staples-rice-flour/"),
    ("Cooking Oil", f"{CARGILLS_BASE_URL}/product-category/cooking-oil/"),
    ("Dairy", f"{CARGILLS_BASE_URL}/product-category/dairy/"),
    ("Beverages", f"{CARGILLS_BASE_URL}/product-category/beverages/"),
    ("Biscuits & Snacks", f"{CARGILLS_BASE_URL}/product-category/biscuits-snacks/"),
    ("Canned Foods", f"{CARGILLS_BASE_URL}/product-category/canned-foods/"),
    ("Household", f"{CARGILLS_BASE_URL}/product-category/household/"),
    ("Personal Care", f"{CARGILLS_BASE_URL}/product-category/personal-care/"),
]

PRODUCT_CARD_SELECTOR = ".product, .product-item, li.product, [data-product-id]"


def _clean_price(text: str) -> float | None:
    match = re.search(r"(?:Rs\.?|LKR)\s*([\d,]+(?:\.\d+)?)", text, re.IGNORECASE)
    if match:
        return float(match.group(1).replace(",", ""))
    match = re.search(r"\b(\d{2,6}(?:\.\d{1,2})?)\b", text)
    if match:
        value = float(match.group(1))
        if 10 <= value <= 100_000:
            return value
    return None


def parse_cargills_category(html: str, category: str) -> list[RawOffer]:
    soup = BeautifulSoup(html, "lxml")
    offers: list[RawOffer] = []

    product_els = soup.select(PRODUCT_CARD_SELECTOR)
    if not product_els:
        product_els = soup.find_all(attrs={"data-product-id": True})

    for element in product_els:
        title_tag = element.select_one(".woocommerce-loop-product__title, .product-title, h2, h3")
        if not title_tag:
            continue
        title = title_tag.get_text(strip=True)
        if not title:
            continue

        price_tag = element.select_one(".price, .woocommerce-Price-amount, .product-price")
        price_text = price_tag.get_text(strip=True) if price_tag else element.get_text(" ", strip=True)
        price = _clean_price(price_text)
        if not price:
            continue

        link_tag = element.select_one("a[href]")
        if not link_tag:
            continue
        href = str(link_tag.get("href", ""))
        if not href:
            continue
        if not href.startswith("http"):
            href = f"{CARGILLS_BASE_URL}{href}"

        slug_match = re.search(r"/([^/?#]+)/?$", href)
        item_id = slug_match.group(1) if slug_match else href[-32:]

        image_url: str | None = None
        img_tag = element.select_one("img")
        if img_tag:
            src = img_tag.get("data-src") or img_tag.get("data-lazy-src") or img_tag.get("src") or ""
            if src and not src.endswith("placeholder"):
                if src.startswith("//"):
                    src = f"https:{src}"
                elif src.startswith("/"):
                    src = f"{CARGILLS_BASE_URL}{src}"
                image_url = src or None

        offers.append(
            RawOffer(
                source="cargills",
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


def fetch_cargills_catalog(max_items: int, user_agent: str) -> list[RawOffer]:
    offers: list[RawOffer] = []
    seen_ids: set[str] = set()
    ua = user_agent or "Mozilla/5.0 (compatible; FoodPlatformBot/1.0)"

    for category, url in CARGILLS_CATEGORY_PAGES:
        if len(offers) >= max_items:
            break
        try:
            html = fetch_rendered_html(url, user_agent=ua, wait_selector=PRODUCT_CARD_SELECTOR)
            page_offers = parse_cargills_category(html, category=category)
            for offer in page_offers:
                if offer.source_item_id not in seen_ids:
                    seen_ids.add(offer.source_item_id)
                    offers.append(offer)
            logger.info("Cargills: %s → %d offers (total %d)", url, len(page_offers), len(offers))
        except Exception as exc:
            logger.warning("Cargills: failed for %s: %s", url, exc)
            continue

    return offers[:max_items]
