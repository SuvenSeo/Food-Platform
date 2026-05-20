from __future__ import annotations

from typing import Any

from sqlalchemy import and_, func

NON_FOOD_RETAIL_CATEGORY_TERMS = (
    "baby",
    "cleaning",
    "detergent",
    "health",
    "household",
    "laundry",
    "personal care",
    "pet",
    "pharmacy",
    "sanitary",
    "stationery",
    "toiletries",
    "toys",
)

NON_FOOD_RETAIL_NAME_TERMS = (
    "baby wipes",
    "battery",
    "bleach",
    "broom",
    "cleaner",
    "conditioner",
    "detergent",
    "diaper",
    "dish wash",
    "dishwash",
    "gate",
    "hanger",
    "laundry",
    "lotion",
    "mask",
    "mop",
    "nappy",
    "sanitary",
    "shampoo",
    "soap",
    "tissue",
    "toilet",
    "toothbrush",
    "toothpaste",
    "wipes",
)


def _contains_any(value: str | None, terms: tuple[str, ...]) -> bool:
    normalized = " ".join(str(value or "").lower().replace("-", " ").replace("_", " ").split())
    return any(term in normalized for term in terms)


def is_food_offer_text(
    category: str | None,
    *names: str | None,
) -> bool:
    if _contains_any(category, NON_FOOD_RETAIL_CATEGORY_TERMS):
        return False
    return not any(_contains_any(name, NON_FOOD_RETAIL_NAME_TERMS) for name in names)


def is_food_offer_record(offer: Any) -> bool:
    return is_food_offer_text(
        getattr(offer, "category", None),
        getattr(offer, "display_name", None),
        getattr(offer, "canonical_name", None),
        getattr(offer, "original_title", None),
    )


def retail_food_offer_clause(model: Any) -> Any:
    category = func.lower(func.coalesce(model.category, ""))
    display_name = func.lower(func.coalesce(model.display_name, ""))
    canonical_name = func.lower(func.coalesce(model.canonical_name, ""))

    filters = []
    filters.extend(~category.like(f"%{term}%") for term in NON_FOOD_RETAIL_CATEGORY_TERMS)
    for term in NON_FOOD_RETAIL_NAME_TERMS:
        pattern = f"%{term}%"
        filters.extend(
            (
                ~display_name.like(pattern),
                ~canonical_name.like(pattern),
            )
        )
    return and_(*filters)
