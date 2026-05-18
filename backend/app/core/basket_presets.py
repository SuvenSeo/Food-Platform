"""Household basket preset definitions shared by estimate and embed APIs."""

BASKET_PRESETS: dict[str, dict[str, object]] = {
    "essentials": {
        "id": "essentials",
        "label": "Essentials Basket",
        "items": [
            {"kind": "offer", "canonical_name": "local coconut oil", "label": "Local coconut oil"},
            {"kind": "market_quote", "item_name": "Tomato", "label": "Tomato"},
        ],
    },
    "protein": {
        "id": "protein",
        "label": "Protein Basket",
        "items": [
            {"kind": "market_quote", "item_name": "Chicken", "label": "Chicken"},
            {"kind": "market_quote", "item_name": "Eggs", "label": "Eggs"},
        ],
    },
    "smart-saver": {
        "id": "smart-saver",
        "label": "Smart Saver",
        "items": [
            {"kind": "offer", "canonical_name": "local coconut oil", "label": "Local coconut oil"},
        ],
    },
    "festive": {
        "id": "festive",
        "label": "Festive Basket",
        "items": [
            {"kind": "offer", "canonical_name": "local coconut oil", "label": "Local coconut oil"},
            {"kind": "market_quote", "item_name": "Tomato", "label": "Tomato"},
            {"kind": "market_quote", "item_name": "Rice", "label": "Rice"},
        ],
    },
}
