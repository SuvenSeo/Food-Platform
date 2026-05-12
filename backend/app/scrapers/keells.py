"""
Keells Super scraper — keells.com (Shopify-based store).

Keells is Sri Lanka's largest supermarket chain under John Keells Holdings.
Their online store runs on Shopify, so we reuse the same /products.json API
pattern as spar2u.

If the store moves away from Shopify the scraper will raise on the first
HTTP call and the pipeline will record a failed run without poisoning data.
"""

import httpx

from app.schemas.domain import RawOffer

KEELLS_BASE_URL = "https://www.keells.com"


def parse_keells_catalog(payload: dict) -> list[RawOffer]:
    offers: list[RawOffer] = []
    for product in payload.get("products", []):
        product_id = str(product["id"])
        url = f"{KEELLS_BASE_URL}/products/{product['handle']}"

        images = product.get("images", [])
        image_url: str | None = images[0].get("src") if images else None

        for variant in product.get("variants", []):
            variant_img = variant.get("featured_image")
            final_image = (variant_img.get("src") if variant_img else None) or image_url

            price_raw = variant.get("price", "0")
            try:
                price = float(price_raw)
            except (TypeError, ValueError):
                continue

            if price <= 0:
                continue

            offers.append(
                RawOffer(
                    source="keells",
                    source_item_id=str(variant["id"]),
                    source_group_id=product_id,
                    category=product.get("product_type", "uncategorized"),
                    title=product["title"],
                    variant_title=variant.get("title"),
                    price_lkr=price,
                    currency="LKR",
                    available=bool(variant.get("available", True)),
                    sku=variant.get("sku"),
                    url=url,
                    image_url=final_image,
                )
            )
    return offers


def fetch_keells_catalog(max_items: int, user_agent: str) -> list[RawOffer]:
    page = 1
    offers: list[RawOffer] = []
    remaining = max_items

    with httpx.Client(
        headers={"User-Agent": user_agent, "Accept": "application/json"},
        follow_redirects=True,
        timeout=30.0,
    ) as client:
        while remaining > 0:
            limit = min(250, remaining)
            response = client.get(
                f"{KEELLS_BASE_URL}/products.json",
                params={"limit": limit, "page": page},
            )
            response.raise_for_status()
            payload = response.json()
            page_offers = parse_keells_catalog(payload)
            if not page_offers:
                break
            offers.extend(page_offers)
            remaining = max_items - len(offers)
            if len(payload.get("products", [])) < limit:
                break
            page += 1

    return offers[:max_items]
