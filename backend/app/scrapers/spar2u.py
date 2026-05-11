import httpx

from app.schemas.domain import RawOffer


def parse_spar2u_catalog(payload: dict) -> list[RawOffer]:
    offers: list[RawOffer] = []
    for product in payload.get("products", []):
        product_id = str(product["id"])
        url = f"https://spar2u.lk/products/{product['handle']}"
        for variant in product.get("variants", []):
            offers.append(
                RawOffer(
                    source="spar2u",
                    source_item_id=str(variant["id"]),
                    source_group_id=product_id,
                    category=product.get("product_type", "uncategorized"),
                    title=product["title"],
                    variant_title=variant.get("title"),
                    price_lkr=float(variant["price"]),
                    currency="LKR",
                    available=bool(variant.get("available", True)),
                    sku=variant.get("sku"),
                    url=url,
                )
            )
    return offers


def fetch_spar2u_catalog(max_items: int, user_agent: str) -> list[RawOffer]:
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
            response = client.get("https://spar2u.lk/products.json", params={"limit": limit, "page": page})
            response.raise_for_status()
            payload = response.json()
            page_offers = parse_spar2u_catalog(payload)
            if not page_offers:
                break
            offers.extend(page_offers)
            remaining = max_items - len(offers)
            if len(payload.get("products", [])) < limit:
                break
            page += 1

    return offers[:max_items]
