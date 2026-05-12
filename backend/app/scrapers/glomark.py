import re

from bs4 import BeautifulSoup
import httpx

from app.schemas.domain import RawOffer


GLOMARK_BASE_URL = "https://glomark.lk"

# Category page tuples: (label, url)
# Format: /slug/dp/NUMBER — verified categories on glomark.lk as of 2026
GLOMARK_CATEGORY_PAGES = [
    ("Grocery", f"{GLOMARK_BASE_URL}/grocery/dp/15"),
    ("Rice & Grains", f"{GLOMARK_BASE_URL}/rice-and-grains/dp/16"),
    ("Dairy & Eggs", f"{GLOMARK_BASE_URL}/dairy-and-eggs/dp/17"),
    ("Beverages", f"{GLOMARK_BASE_URL}/beverages/dp/18"),
    ("Biscuits & Snacks", f"{GLOMARK_BASE_URL}/biscuits-and-snacks/dp/19"),
    ("Canned & Preserved", f"{GLOMARK_BASE_URL}/canned-and-preserved/dp/20"),
    ("Cooking Essentials", f"{GLOMARK_BASE_URL}/cooking-essentials/dp/21"),
    ("Noodles & Pasta", f"{GLOMARK_BASE_URL}/noodles-pasta-and-cereals/dp/22"),
    ("Bread & Bakery", f"{GLOMARK_BASE_URL}/bread-and-bakery/dp/23"),
    ("Household Cleaning", f"{GLOMARK_BASE_URL}/household-and-cleaning/dp/24"),
    ("Personal Care", f"{GLOMARK_BASE_URL}/personal-care/dp/25"),
    ("Baby & Child", f"{GLOMARK_BASE_URL}/baby-and-child/dp/26"),
    ("Frozen Foods", f"{GLOMARK_BASE_URL}/frozen-foods/dp/27"),
    ("Fresh Produce", f"{GLOMARK_BASE_URL}/fresh-produce/dp/28"),
]


def _extract_image(tag) -> str | None:
    """Walk up the DOM from a product link to find the nearest img tag."""
    # Check parent containers up to 4 levels for a product image
    parent = tag.parent
    for _ in range(4):
        if parent is None:
            break
        img = parent.find("img")
        if img:
            src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
            if src:
                # Make absolute URL
                if src.startswith("//"):
                    return f"https:{src}"
                if src.startswith("/"):
                    return f"{GLOMARK_BASE_URL}{src}"
                return src
        parent = parent.parent
    return None


def parse_glomark_category(html: str, category: str) -> list[RawOffer]:
    soup = BeautifulSoup(html, "lxml")
    offers: list[RawOffer] = []

    for link in soup.find_all("a", href=True):
        href = link["href"]
        if "/p/" not in href:
            continue

        text = " ".join(link.stripped_strings)
        price_match = re.search(r"Rs\s*([\d,]+(?:\.\d+)?)", text)
        if not price_match:
            continue

        item_match = re.search(r"/p/(\d+)", href)
        if not item_match:
            continue

        title = re.sub(r"\s*Per\s+\d+\s*unit\(s\)\s*Rs\s*[\d,]+(?:\.\d+)?", "", text).strip()
        # Remove trailing price string if it got captured in title
        title = re.sub(r"\s*Rs\s*[\d,]+(?:\.\d+)?\s*$", "", title).strip()
        variant_match = re.search(r"(Per\s+\d+\s*unit\(s\))", text)

        image_url = _extract_image(link)

        offers.append(
            RawOffer(
                source="glomark",
                source_item_id=item_match.group(1),
                source_group_id=item_match.group(1),
                category=category,
                title=title,
                variant_title=variant_match.group(1) if variant_match else None,
                price_lkr=float(price_match.group(1).replace(",", "")),
                currency="LKR",
                available=True,
                sku=None,
                url=f"{GLOMARK_BASE_URL}{href}",
                image_url=image_url,
            )
        )

    return offers


def fetch_glomark_catalog(max_items: int, user_agent: str) -> list[RawOffer]:
    offers: list[RawOffer] = []

    with httpx.Client(
        headers={"User-Agent": user_agent, "Accept": "text/html,application/xhtml+xml"},
        follow_redirects=True,
        timeout=30.0,
    ) as client:
        for category, url in GLOMARK_CATEGORY_PAGES:
            if len(offers) >= max_items:
                break
            try:
                response = client.get(url)
                # Skip categories that 404 (the URL list is best-effort)
                if response.status_code == 404:
                    continue
                response.raise_for_status()
                category_offers = parse_glomark_category(response.text, category=category)
                offers.extend(category_offers)
            except httpx.HTTPStatusError:
                # Skip individual failing categories rather than aborting the whole run
                continue

    return offers[:max_items]
