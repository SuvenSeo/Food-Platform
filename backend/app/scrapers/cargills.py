"""
Cargills Online scraper.

The old Cargills Ceylon catalogue pages no longer expose product cards. The
current storefront powers its homepage modules from a JSON endpoint, so the
scheduled scraper reads that endpoint directly and normalizes product modules
into RawOffer rows.
"""

from __future__ import annotations

import logging
import re
from typing import Any

import httpx
from bs4 import BeautifulSoup

from app.schemas.domain import RawOffer
from app.scrapers.browser import chromium_page, fetch_rendered_html

logger = logging.getLogger(__name__)

CARGILLS_BASE_URL = "https://cargillsonline.com"
CARGILLS_DYNAMIC_SECTION_URL = f"{CARGILLS_BASE_URL}/Web/GetDynamicSection/"
CARGILLS_EMPTY_FILTER = "Wwzpa2LygAJqAK1uM94i8A=="

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
CATEGORY_BY_PREFIX = {
    "V": "Vegetables",
    "F": "Fruits",
    "B": "Beverages",
    "M": "Meat & Fish",
    "D": "Dairy",
    "G": "Grocery",
}


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


def _absolute_url(raw_url: object) -> str | None:
    if not raw_url:
        return None
    url = str(raw_url).strip()
    if not url:
        return None
    if url.startswith("//"):
        return f"https:{url}"
    if url.startswith("/"):
        return f"{CARGILLS_BASE_URL}{url}"
    return url


def _variant_title(product: dict[str, Any]) -> str | None:
    unit_size = _as_float(product.get("UnitSize"))
    uom = str(product.get("UOM") or "").strip()
    if unit_size and uom:
        amount = f"{unit_size:g}"
        return f"Per {amount}{uom.lower()}"

    pack_size = _as_float(product.get("PackSize"))
    if pack_size and pack_size != 1:
        return f"Pack of {pack_size:g}"
    return None


def _category_for_product(product: dict[str, Any], fallback: str) -> str:
    category_code = str(product.get("CategoryCode") or "").strip().upper()
    item_type = str(product.get("Type") or "").strip().upper()
    prefix = category_code[:1] or item_type[:1]
    return CATEGORY_BY_PREFIX.get(prefix, fallback or "Grocery")


def _product_to_offer(product: dict[str, Any], fallback_category: str) -> RawOffer | None:
    title = str(product.get("ItemName") or product.get("Description") or "").strip()
    price = _as_float(product.get("Price")) or _as_float(product.get("Mrp"))
    item_id = str(
        product.get("Id")
        or product.get("SKUCODE")
        or product.get("MasterSKUCODE")
        or ""
    ).strip()
    if not title or title.lower().startswith("no products") or not price or not item_id or item_id == "0":
        return None

    image_url = _absolute_url(product.get("WebImage") or product.get("ItemImage"))
    return RawOffer(
        source="cargills",
        source_item_id=item_id,
        source_group_id=str(product.get("MasterSKUCODE") or item_id),
        category=_category_for_product(product, fallback_category),
        title=title,
        variant_title=_variant_title(product),
        price_lkr=price,
        currency="LKR",
        available=str(product.get("IsSaleable", "1")).lower() not in {"0", "false", "none"},
        sku=str(product.get("SKUCODE") or "") or None,
        url=f"{CARGILLS_BASE_URL}/Product?productID={item_id}",
        image_url=image_url,
    )


def parse_cargills_dynamic_sections(payload: object, max_items: int | None = None) -> list[RawOffer]:
    """Parse Cargills dynamic homepage sections into product offers."""
    if not isinstance(payload, list):
        raise ValueError("Cargills dynamic section payload must be a list.")

    offers: list[RawOffer] = []
    seen_ids: set[str] = set()

    for section in payload:
        if not isinstance(section, dict):
            continue
        if str(section.get("DataType") or "").lower() != "product":
            continue

        section_name = str(section.get("SectionName") or "Grocery").strip() or "Grocery"
        products = section.get("Data")
        if not isinstance(products, list):
            continue

        for product in products:
            if not isinstance(product, dict):
                continue
            offer = _product_to_offer(product, section_name)
            if not offer or offer.source_item_id in seen_ids:
                continue

            seen_ids.add(offer.source_item_id)
            offers.append(offer)
            if max_items and len(offers) >= max_items:
                return offers

    return offers


def _extract_category_refs(payload: object) -> list[tuple[str, str]]:
    if not isinstance(payload, list):
        return []

    refs: list[tuple[str, str]] = []
    seen_ids: set[str] = set()
    for section in payload:
        if not isinstance(section, dict):
            continue
        rows = section.get("Data")
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            category_id = str(row.get("EnId") or "").strip()
            category_name = str(
                row.get("MenuCategoryName")
                or row.get("MENUCATEGORYNAME")
                or row.get("CollectionName")
                or ""
            ).strip()
            if category_id and category_name and category_id not in seen_ids:
                seen_ids.add(category_id)
                refs.append((category_id, category_name))
    return refs


def _parse_cargills_products(products: object, category: str, seen_ids: set[str], max_items: int | None) -> list[RawOffer]:
    if not isinstance(products, list):
        return []

    offers: list[RawOffer] = []
    for product in products:
        if not isinstance(product, dict):
            continue
        offer = _product_to_offer(product, category)
        if not offer or offer.source_item_id in seen_ids:
            continue
        seen_ids.add(offer.source_item_id)
        offers.append(offer)
        if max_items and len(seen_ids) >= max_items:
            break
    return offers


def _fetch_cargills_browser_catalog(
    category_refs: list[tuple[str, str]],
    *,
    max_items: int,
    user_agent: str,
) -> list[RawOffer]:
    """Fetch category product JSON inside a browser page context.

    The category endpoint currently returns "No Products Found" to plain httpx,
    but succeeds from the site's browser context. We keep this scoped to the
    public product-list endpoint and avoid any cart/checkout actions.
    """
    offers: list[RawOffer] = []
    seen_ids: set[str] = set()

    with chromium_page(user_agent=user_agent, timeout_ms=60_000) as page:
        page.goto(CARGILLS_BASE_URL, wait_until="domcontentloaded")
        for category_id, category_name in category_refs:
            if len(offers) >= max_items:
                break

            payload = {
                "CategoryId": category_id,
                "Search": "",
                "Filter": CARGILLS_EMPTY_FILTER,
                "PageIndex": 1,
                "PageSize": max_items,
                "BannerId": "",
                "SectionId": "",
                "CollectionId": "",
                "SectionType": "",
                "DataType": "",
                "SubCatId": "-1",
                "PromoId": "",
            }
            rows = page.evaluate(
                """
                async (payload) => {
                    const response = await fetch('/Web/GetMenuCategoryItemsPagingV3/', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json, text/plain, */*',
                            'Content-Type': 'application/json;charset=UTF-8'
                        },
                        body: JSON.stringify(payload)
                    });
                    return await response.json();
                }
                """,
                payload,
            )
            offers.extend(_parse_cargills_products(rows, category_name, seen_ids, max_items))

    return offers[:max_items]


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
    ua = user_agent or "Mozilla/5.0 (compatible; FoodPlatformBot/1.0)"

    try:
        headers = {
            "User-Agent": ua,
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Origin": CARGILLS_BASE_URL,
            "Referer": f"{CARGILLS_BASE_URL}/",
        }
        with httpx.Client(timeout=30, follow_redirects=True, headers=headers) as client:
            response = client.post(CARGILLS_DYNAMIC_SECTION_URL, json={})
            response.raise_for_status()
            dynamic_payload = response.json()
            category_refs = _extract_category_refs(dynamic_payload)

        offers = []
        seen_ids: set[str] = set()
        if category_refs:
            try:
                for offer in _fetch_cargills_browser_catalog(
                    category_refs,
                    max_items=max_items,
                    user_agent=ua,
                ):
                    if offer.source_item_id not in seen_ids:
                        seen_ids.add(offer.source_item_id)
                        offers.append(offer)
            except Exception as exc:
                logger.warning("Cargills: browser category catalog failed: %s", exc)

        for offer in parse_cargills_dynamic_sections(dynamic_payload, max_items=max_items):
            if len(offers) >= max_items:
                break
            if offer.source_item_id not in seen_ids:
                seen_ids.add(offer.source_item_id)
                offers.append(offer)

        if offers:
            logger.info("Cargills: scraped %d offers from JSON endpoints", len(offers))
            return offers[:max_items]
        logger.warning("Cargills: JSON endpoints returned no product offers")
    except Exception as exc:
        logger.warning("Cargills: dynamic section scrape failed: %s", exc)

    offers: list[RawOffer] = []
    seen_ids: set[str] = set()
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
