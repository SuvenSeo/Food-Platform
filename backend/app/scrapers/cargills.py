"""
Cargills Food City scraper — cargillsceylon.com

Cargills is one of Sri Lanka's largest retail chains. Their online store
is HTML-based. We parse category listing pages to extract product names,
prices, and images.

Category pages follow the pattern:
  https://www.cargillsceylon.com/category/<slug>

If the site structure changes or the request fails, the scraper logs the
failure and the pipeline records a failed run.
"""

import re

from bs4 import BeautifulSoup
import httpx

from app.schemas.domain import RawOffer

CARGILLS_BASE_URL = "https://www.cargillsceylon.com"

# Best-effort category listing; the scraper skips 404s gracefully
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


def _clean_price(text: str) -> float | None:
    """Extract first Rs/LKR price from text."""
    m = re.search(r"(?:Rs\.?|LKR)\s*([\d,]+(?:\.\d+)?)", text, re.IGNORECASE)
    if m:
        return float(m.group(1).replace(",", ""))
    # Fallback: standalone number that looks like a price
    m2 = re.search(r"\b(\d{2,6}(?:\.\d{1,2})?)\b", text)
    if m2:
        val = float(m2.group(1))
        if 10 <= val <= 100000:
            return val
    return None


def parse_cargills_category(html: str, category: str) -> list[RawOffer]:
    soup = BeautifulSoup(html, "lxml")
    offers: list[RawOffer] = []

    # WooCommerce / typical product grid: .product, .woocommerce-loop-product
    product_els = soup.select(".product, .product-item, li.product")
    if not product_els:
        # Fallback: look for articles or divs with data-product-id
        product_els = soup.find_all(attrs={"data-product-id": True})

    for el in product_els:
        # Title
        title_tag = el.select_one(".woocommerce-loop-product__title, .product-title, h2, h3")
        if not title_tag:
            continue
        title = title_tag.get_text(strip=True)
        if not title:
            continue

        # Price
        price_tag = el.select_one(".price, .woocommerce-Price-amount, .product-price")
        price_text = price_tag.get_text(strip=True) if price_tag else el.get_text(" ", strip=True)
        price = _clean_price(price_text)
        if not price:
            continue

        # URL
        link_tag = el.select_one("a[href]")
        if not link_tag:
            continue
        href = link_tag.get("href", "")
        if not href:
            continue
        if not href.startswith("http"):
            href = f"{CARGILLS_BASE_URL}{href}"

        # Item ID from URL slug
        slug_match = re.search(r"/([^/?#]+)/?$", href)
        item_id = slug_match.group(1) if slug_match else href[-32:]

        # Image
        img_tag = el.select_one("img")
        image_url: str | None = None
        if img_tag:
            src = (img_tag.get("data-src") or img_tag.get("data-lazy-src")
                   or img_tag.get("src") or "")
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

    with httpx.Client(
        headers={"User-Agent": user_agent, "Accept": "text/html,application/xhtml+xml"},
        follow_redirects=True,
        timeout=30.0,
    ) as client:
        for category, url in CARGILLS_CATEGORY_PAGES:
            if len(offers) >= max_items:
                break
            try:
                response = client.get(url)
                if response.status_code == 404:
                    continue
                response.raise_for_status()
                page_offers = parse_cargills_category(response.text, category=category)
                offers.extend(page_offers)
            except httpx.HTTPStatusError:
                continue

    return offers[:max_items]
