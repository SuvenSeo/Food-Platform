import re

from bs4 import BeautifulSoup
import httpx

from app.schemas.domain import RawOffer

GLOMARK_BASE_URL = "https://glomark.lk"
GLOMARK_CATEGORY_PAGES = [
    ("Grocery", f"{GLOMARK_BASE_URL}/grocery/dp/15"),
]


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
        variant_match = re.search(r"(Per\s+\d+\s*unit\(s\))", text)

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
            response = client.get(url)
            response.raise_for_status()
            offers.extend(parse_glomark_category(response.text, category=category))
            if len(offers) >= max_items:
                break

    return offers[:max_items]
