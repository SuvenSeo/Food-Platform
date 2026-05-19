"""
Keells Super scraper.

Keells moved from the old keells.com supermarket pages to keellssuper.com. The
current storefront hydrates the public homepage with a guest session and a JSON
data-collection endpoint, so the scheduled scraper uses that API first and only
falls back to rendered HTML if the API changes.
"""

from __future__ import annotations

import logging
import re
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.schemas.domain import RawOffer
from app.scrapers.browser import fetch_rendered_html

logger = logging.getLogger(__name__)

KEELLS_BASE_URL = "https://keellssuper.com"
KEELLS_BACKEND_URL = "https://zebraliveback.keellssuper.com/1.0"
KEELLS_REFERER = "https://www.keellssuper.com/"

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
PRODUCT_LIST_KEYS = (
    "keellsOwnLabelItems",
    "dealsProductsList",
    "bestSellersList",
    "featuredProductsList",
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


def _as_float(value: object) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        amount = float(value)
    else:
        match = re.search(r"(\d+(?:,\d{3})*(?:\.\d+)?)", str(value))
        if not match:
            return None
        amount = float(match.group(1).replace(",", ""))
    return amount if 5 <= amount <= 100_000 else None


def _category_maps(result: dict[str, Any]) -> tuple[dict[str, str], dict[str, str]]:
    departments: dict[str, str] = {}
    categories: dict[str, str] = {}

    for key in ("departmentV2s", "departmentList"):
        rows = result.get(key)
        if isinstance(rows, list):
            for row in rows:
                if isinstance(row, dict):
                    code = str(row.get("departmentCode") or "").strip()
                    name = str(row.get("departmentName") or row.get("title") or "").strip()
                    if code and name:
                        departments[code] = name

    for key in ("categoryV2s", "categoryList"):
        rows = result.get(key)
        if isinstance(rows, list):
            for row in rows:
                if isinstance(row, dict):
                    code = str(row.get("categoryCode") or "").strip()
                    name = str(row.get("categoryName") or row.get("title") or "").strip()
                    if code and name:
                        categories[code] = name

    return departments, categories


def _variant_title(product: dict[str, Any]) -> str | None:
    uom = str(product.get("uom") or product.get("UOM") or "").strip().upper()
    if uom in {"KG", "KGS"}:
        return "Per 1kg"
    if uom in {"G", "GR", "GRAM"}:
        return "Per 1g"
    if uom in {"L", "LT", "LTR"}:
        return "Per 1l"
    if uom in {"ML"}:
        return "Per 1ml"
    if uom in {"NO", "NOS", "EA", "PCS", "PC"}:
        return "Per 1unit(s)"
    return uom or None


def _product_url(item_id: str) -> str:
    return f"{KEELLS_BASE_URL}/productDetail?itemId={item_id}"


def parse_keells_initial_data(payload: object, max_items: int | None = None) -> list[RawOffer]:
    """Parse Keells initial data-collection payload into product offers."""
    if not isinstance(payload, dict):
        raise ValueError("Keells payload must be a JSON object.")

    result = payload.get("result", payload)
    if not isinstance(result, dict):
        raise ValueError("Keells payload is missing a result object.")

    department_names, category_names = _category_maps(result)
    offers: list[RawOffer] = []
    seen_ids: set[str] = set()

    for list_key in PRODUCT_LIST_KEYS:
        products = result.get(list_key)
        if not isinstance(products, list):
            continue

        for product in products:
            if not isinstance(product, dict):
                continue

            item_id = str(product.get("itemID") or product.get("itemId") or product.get("itemCode") or "").strip()
            title = str(product.get("name") or product.get("itemName") or product.get("longDescription") or "").strip()
            price = _as_float(product.get("amount") or product.get("price"))
            if not item_id or not title or not price or item_id in seen_ids:
                continue

            category_code = str(product.get("categoryCode") or "").strip()
            department_code = str(product.get("departmentCode") or "").strip()
            category = (
                category_names.get(category_code)
                or department_names.get(department_code)
                or "Grocery"
            )

            seen_ids.add(item_id)
            offers.append(
                RawOffer(
                    source="keells",
                    source_item_id=item_id,
                    source_group_id=item_id,
                    category=category,
                    title=title,
                    variant_title=_variant_title(product),
                    price_lkr=price,
                    currency="LKR",
                    available=bool(product.get("isAvailable", True)) and bool(product.get("isSellingToday", True)),
                    sku=str(product.get("itemCode") or "") or None,
                    url=_product_url(item_id),
                    image_url=str(product.get("imageUrl") or product.get("enlargeImageUrl") or "") or None,
                )
            )
            if max_items and len(offers) >= max_items:
                return offers

    return offers


def _keells_headers(user_agent: str, session_id: str | None = None) -> dict[str, str]:
    headers = {
        "User-Agent": user_agent,
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Origin": "https://www.keellssuper.com",
        "Referer": KEELLS_REFERER,
        "X-Frame-Options": "DENY",
    }
    if session_id:
        headers["usersessionid"] = session_id
    return headers


def _fetch_keells_api_catalog(max_items: int, user_agent: str) -> list[RawOffer]:
    with httpx.Client(
        timeout=30,
        follow_redirects=True,
        headers=_keells_headers(user_agent),
    ) as client:
        login = client.post(f"{KEELLS_BACKEND_URL}/Login/GuestLogin")
        login.raise_for_status()
        login_payload = login.json()
        result = login_payload.get("result") if isinstance(login_payload, dict) else None
        if not isinstance(result, dict):
            raise ValueError("Keells guest login response is missing result.")
        session_id = str(result.get("userSessionID") or "").strip()
        outlet = str(result.get("preferredOutlet") or "SCDR").strip() or "SCDR"
        if not session_id:
            raise ValueError("Keells guest login response is missing userSessionID.")

        client.headers.update(_keells_headers(user_agent, session_id=session_id))
        data = client.get(
            f"{KEELLS_BACKEND_URL}/WebV2/GetInitialDataCollection",
            params={"locationCode": outlet, "shippingDetailsId": 0},
        )
        data.raise_for_status()
        offers = parse_keells_initial_data(data.json(), max_items=max_items)

        if len(offers) < max_items:
            legacy = client.get(
                f"{KEELLS_BACKEND_URL}/Web/GetInitialDataCollection",
                params={"locationCode": outlet, "shippingDetailsId": 0},
            )
            legacy.raise_for_status()
            legacy_offers = parse_keells_initial_data(legacy.json(), max_items=max_items)
            seen_ids = {offer.source_item_id for offer in offers}
            for offer in legacy_offers:
                if offer.source_item_id not in seen_ids:
                    seen_ids.add(offer.source_item_id)
                    offers.append(offer)
                if len(offers) >= max_items:
                    break

        return offers[:max_items]


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
    ua = user_agent or "Mozilla/5.0 (compatible; FoodPlatformBot/1.0)"

    try:
        offers = _fetch_keells_api_catalog(max_items=max_items, user_agent=ua)
        if offers:
            logger.info("Keells: scraped %d offers from API data collection", len(offers))
            return offers[:max_items]
        logger.warning("Keells: API data collection returned no offers")
    except Exception as exc:
        logger.warning("Keells: API scrape failed: %s", exc)

    offers: list[RawOffer] = []
    seen_ids: set[str] = set()
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
