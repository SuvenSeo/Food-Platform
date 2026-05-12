import pytest
from types import SimpleNamespace
from sqlalchemy.engine import make_url

from app.core.config import Settings
from app.db import session as session_module


def test_development_env_can_fallback_to_sqlite_when_database_url_missing() -> None:
    settings = Settings(APP_ENV="development", DATABASE_URL="")

    assert settings.resolved_database_url == "sqlite:///./food_platform.db"


def test_staging_env_requires_database_url_by_default() -> None:
    settings = Settings(APP_ENV="staging", DATABASE_URL="")

    with pytest.raises(ValueError, match="DATABASE_URL must be set"):
        _ = settings.resolved_database_url


def test_production_env_blocks_sqlite_even_when_fallback_enabled() -> None:
    settings = Settings(
        APP_ENV="production",
        DATABASE_URL="sqlite:///./food_platform.db",
        ALLOW_SQLITE_FALLBACK="true",
    )

    with pytest.raises(ValueError, match="SQLite is not allowed"):
        _ = settings.resolved_database_url


def test_staging_env_accepts_postgres_database_url() -> None:
    settings = Settings(
        APP_ENV="staging",
        DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/food",
        ALLOW_SQLITE_FALLBACK="false",
    )

    assert settings.resolved_database_url.startswith("postgresql+psycopg://")


def test_market_quote_sync_config_fields_are_readable_from_env() -> None:
    settings = Settings(
        MARKET_QUOTES_URL="https://example.com/market-quotes.json",
        MARKET_QUOTES_TIMEOUT_SECONDS="12.5",
        MARKET_QUOTES_FORMAT="json",
        MARKET_QUOTES_SEED_FALLBACK_ENABLED="false",
    )

    assert settings.market_quotes_url == "https://example.com/market-quotes.json"
    assert settings.market_quotes_timeout_seconds == 12.5
    assert settings.market_quotes_format == "json"
    assert settings.market_quotes_seed_fallback_enabled is False


@pytest.mark.parametrize(
    ("database_url", "expected_provider", "expected_is_supabase_host"),
    [
        ("postgresql://user:pass@db.supabase.co:5432/food", "supabase-postgres", True),
        ("mysql://user:pass@db.supabase.co:3306/food", "mysql", False),
    ],
)
def test_provider_status_only_flags_supabase_for_postgres(
    monkeypatch: pytest.MonkeyPatch,
    database_url: str,
    expected_provider: str,
    expected_is_supabase_host: bool,
) -> None:
    monkeypatch.setattr(session_module, "engine", SimpleNamespace(url=make_url(database_url)))

    status = session_module.get_database_provider_status()

    assert status["provider"] == expected_provider
    assert status["is_supabase_host"] is expected_is_supabase_host
