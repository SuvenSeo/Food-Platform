import re

from app.schemas.domain import NormalizedOffer, RawOffer

MEASUREMENT_PATTERN = re.compile(r"(?P<amount>\d+(?:\.\d+)?)\s*(?P<unit>kg|g|l|ml)\b", re.IGNORECASE)


def _extract_brand_and_name(title: str) -> tuple[str | None, str]:
    main = title.split(",")[0].strip()
    parts = main.split()
    if not parts:
        return None, ""
    brand = parts[0]
    remainder = " ".join(parts[1:]).strip() or main
    return brand, remainder


def _extract_measurement(title: str, variant_title: str | None) -> tuple[str | None, float | None]:
    match = MEASUREMENT_PATTERN.search(title)
    if match:
        amount = float(match.group("amount"))
        unit = match.group("unit").lower()
        if unit == "g":
            return "kg", amount / 1000
        if unit == "ml":
            return "l", amount / 1000
        return unit, amount

    if variant_title:
        weight_match = re.search(r"/\s*(\d+(?:\.\d+)?)", variant_title)
        if weight_match:
            amount = float(weight_match.group(1))
            return "kg", amount / 1000

    return None, None


def normalize_offer(raw: RawOffer) -> NormalizedOffer:
    brand, canonical_name = _extract_brand_and_name(raw.title)
    unit, unit_amount = _extract_measurement(raw.title, raw.variant_title)
    canonical_name = MEASUREMENT_PATTERN.sub("", canonical_name).strip(" ,.-").lower()
    cluster_key = "|".join(
        [
            (brand or "generic").lower(),
            canonical_name,
            unit or "unit",
            f"{unit_amount:.3f}" if unit_amount is not None else "0.000",
        ]
    )

    return NormalizedOffer(
        source=raw.source,
        source_item_id=raw.source_item_id,
        source_group_id=raw.source_group_id,
        category=raw.category.lower(),
        brand=brand,
        canonical_name=canonical_name,
        display_name=raw.title.split(",")[0].strip(),
        unit=unit,
        unit_amount=unit_amount,
        pack_descriptor=raw.variant_title,
        price_lkr=raw.price_lkr,
        price_per_unit_lkr=(raw.price_lkr / unit_amount) if unit_amount else raw.price_lkr,
        currency=raw.currency,
        available=raw.available,
        sku=raw.sku,
        url=raw.url,
        cluster_key=cluster_key,
    )
