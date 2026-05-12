import pytest

from app.core.config import Settings


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
