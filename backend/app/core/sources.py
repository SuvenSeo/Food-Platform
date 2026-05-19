"""Canonical source registry shared across API, CLI, and automation."""

from __future__ import annotations

from dataclasses import dataclass

from app.core.config import get_settings


@dataclass(frozen=True)
class SourceProfile:
    key: str
    label: str
    type: str
    enabled: bool
    expected_frequency_minutes: int
    timeout_seconds: int
    minimum_rows: int
    stale_after_minutes: int


DEFAULT_RETAIL_SOURCES: tuple[str, ...] = ("spar2u", "glomark", "keells", "cargills")
DEFAULT_MARKET_SOURCES: tuple[str, ...] = ("wfp", "cbsl", "dcs", "doa")

SOURCE_PROFILES: dict[str, SourceProfile] = {
    "spar2u": SourceProfile("spar2u", "Spar2U", "retail", True, 360, 1200, 1, 720),
    "glomark": SourceProfile("glomark", "Glomark", "retail", True, 360, 1200, 1, 720),
    "keells": SourceProfile("keells", "Keells", "retail", True, 360, 1200, 1, 720),
    "cargills": SourceProfile("cargills", "Cargills", "retail", True, 360, 1200, 1, 720),
    "wfp": SourceProfile("wfp", "World Food Programme", "market", True, 360, 60, 1, 1440),
    "cbsl": SourceProfile("cbsl", "Central Bank Daily Price Report", "market", True, 360, 60, 1, 1440),
    "dcs": SourceProfile("dcs", "Department of Census and Statistics", "market", True, 360, 60, 1, 10080),
    "doa": SourceProfile("doa", "Department of Agriculture", "market", True, 360, 60, 1, 1440),
}


def all_source_profiles() -> list[SourceProfile]:
    return [SOURCE_PROFILES[key] for key in (*DEFAULT_RETAIL_SOURCES, *DEFAULT_MARKET_SOURCES)]


def get_source_profile(source: str) -> SourceProfile | None:
    return SOURCE_PROFILES.get(source.strip().lower())


def expected_source_keys() -> list[str]:
    return [profile.key for profile in all_source_profiles() if profile.enabled]


def default_retail_sources_csv() -> str:
    return ",".join(DEFAULT_RETAIL_SOURCES)


def default_market_sources_csv() -> str:
    return ",".join(DEFAULT_MARKET_SOURCES)


def enabled_retail_sources() -> list[str]:
    settings = get_settings()
    toggles = {
        "spar2u": settings.spar2u_enabled,
        "glomark": settings.glomark_enabled,
        "keells": settings.keells_enabled,
        "cargills": settings.cargills_enabled,
    }
    return [source for source in DEFAULT_RETAIL_SOURCES if toggles.get(source, False)]
