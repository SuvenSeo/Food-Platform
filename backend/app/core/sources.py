"""Canonical retail source identifiers shared across API, CLI, and automation."""

DEFAULT_RETAIL_SOURCES: tuple[str, ...] = ("spar2u", "glomark", "keells", "cargills")


def default_retail_sources_csv() -> str:
    return ",".join(DEFAULT_RETAIL_SOURCES)
