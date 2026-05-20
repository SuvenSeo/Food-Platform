import re

from app.schemas.domain import NormalizedOffer, RawOffer

MEASUREMENT_PATTERN = re.compile(
    r"(?P<amount>\d+(?:\.\d+)?)\s*(?P<unit>kg|g|l|ml|ltr|litre|liter)\b",
    re.IGNORECASE,
)
PER_UNIT_PATTERN = re.compile(
    r"\bper\s+(?P<amount>\d+(?:\.\d+)?)\s*(?P<unit>kg|g|l|ml|ltr|litre|liter|unit|piece|pieces|pcs|pack|dozen)(?:\(s\))?(?=\s|$)",
    re.IGNORECASE,
)
PRICE_TEXT_PATTERN = re.compile(r"\brs\.?\s*[\d,]+(?:\.\d+)?\b", re.IGNORECASE)

FRESH_CATEGORIES = {
    "fruit",
    "fruits",
    "vegetable",
    "vegetables",
    "meat",
    "fish",
    "seafood",
    "fresh",
    "produce",
}
FRESH_TITLE_TERMS = {
    "beans",
    "beetroot",
    "brinjal",
    "cabbage",
    "carrot",
    "cucumber",
    "leeks",
    "lime",
    "mango",
    "onion",
    "papaya",
    "plantain",
    "potato",
    "pumpkin",
    "tomato",
}

LIQUID_TITLE_TERMS = {
    "beverage",
    "drink",
    "juice",
    "milk",
    "oil",
    "sauce",
    "water",
}

SOLID_SMALL_PACK_TITLE_TERMS = {
    "butter",
    "cheese",
    "curd",
    "yoghurt",
    "yogurt",
}


def _is_fresh_category(category: str) -> bool:
    normalized = category.lower()
    return any(token in normalized for token in FRESH_CATEGORIES)


def _looks_like_fresh_title(title: str) -> bool:
    words = set(re.findall(r"[a-z]+", title.lower()))
    return bool(words & FRESH_TITLE_TERMS)


def _normalize_unit(unit: str) -> tuple[str, float]:
    normalized = unit.lower()
    if normalized == "g":
        return "kg", 0.001
    if normalized == "ml":
        return "l", 0.001
    if normalized in {"ltr", "litre", "liter"}:
        return "l", 1.0
    if normalized in {"pieces", "pcs"}:
        return "piece", 1.0
    return normalized, 1.0


def _strip_measurement_text(value: str) -> str:
    value = PER_UNIT_PATTERN.sub("", value)
    value = MEASUREMENT_PATTERN.sub("", value)
    value = PRICE_TEXT_PATTERN.sub("", value)
    return re.sub(r"\s+", " ", value).strip(" ,.-")


def _extract_brand_and_name(title: str, category: str) -> tuple[str | None, str]:
    main = _strip_measurement_text(title.split(",")[0].strip())
    if _is_fresh_category(category) or _looks_like_fresh_title(main):
        return None, main

    parts = main.split()
    if not parts:
        return None, ""
    brand = parts[0]
    remainder = " ".join(parts[1:]).strip() or main
    return brand, remainder


def _extract_measurement(title: str, variant_title: str | None) -> tuple[str | None, float | None]:
    if variant_title:
        per_match = PER_UNIT_PATTERN.search(variant_title)
        if per_match:
            amount = float(per_match.group("amount"))
            unit, multiplier = _normalize_unit(per_match.group("unit"))
            return unit, amount * multiplier

        match = MEASUREMENT_PATTERN.search(variant_title)
        if match:
            amount = float(match.group("amount"))
            unit, multiplier = _normalize_unit(match.group("unit"))
            return unit, amount * multiplier

        weight_match = re.search(r"/\s*(\d+(?:\.\d+)?)", variant_title)
        if weight_match:
            amount = float(weight_match.group(1))
            words = set(re.findall(r"[a-z]+", f"{title} {variant_title}".lower()))
            if words & LIQUID_TITLE_TERMS:
                return "l", amount / 1000
            if words & SOLID_SMALL_PACK_TITLE_TERMS:
                return "kg", amount / 1000

    per_match = PER_UNIT_PATTERN.search(title)
    if per_match:
        amount = float(per_match.group("amount"))
        unit, multiplier = _normalize_unit(per_match.group("unit"))
        return unit, amount * multiplier

    match = MEASUREMENT_PATTERN.search(title)
    if match:
        amount = float(match.group("amount"))
        unit, multiplier = _normalize_unit(match.group("unit"))
        return unit, amount * multiplier

    return None, None


def normalize_offer(raw: RawOffer) -> NormalizedOffer:
    brand, canonical_name = _extract_brand_and_name(raw.title, raw.category)
    unit, unit_amount = _extract_measurement(raw.title, raw.variant_title)
    canonical_name = _strip_measurement_text(canonical_name).lower()
    display_name = _strip_measurement_text(raw.title.split(",")[0].strip())
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
        display_name=display_name,
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
        image_url=raw.image_url,
    )
