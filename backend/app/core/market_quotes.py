from datetime import datetime, timedelta, timezone


ACTIONABLE_MARKET_QUOTE_DAYS = 30
MARKET_QUOTE_WARNING_AFTER_MINUTES = 18 * 60
MARKET_QUOTE_STALE_AFTER_MINUTES = 36 * 60
NON_FOOD_MARKET_CATEGORIES = frozenset(
    {
        "fuel",
        "non-food",
        "transport",
        "energy",
    }
)


def actionable_market_quote_cutoff(now: datetime | None = None) -> datetime:
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    return current - timedelta(days=ACTIONABLE_MARKET_QUOTE_DAYS)


def is_food_market_category(category: str | None) -> bool:
    normalized = (category or "").strip().lower()
    return normalized not in NON_FOOD_MARKET_CATEGORIES
