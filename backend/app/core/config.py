from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

SQLITE_DEFAULT_URL = "sqlite:///./food_platform.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    app_name: str = Field(default="Food Price Intelligence API", alias="APP_NAME")
    api_prefix: str = Field(default="/api/v1", alias="API_PREFIX")
    admin_api_key: str = Field(default="change-me", alias="ADMIN_API_KEY")
    allow_sqlite_fallback: bool = Field(default=True, alias="ALLOW_SQLITE_FALLBACK")
    database_url: str = Field(default="", alias="DATABASE_URL")
    cors_origins: str = Field(default="http://localhost:5173,http://127.0.0.1:5173", alias="CORS_ORIGINS")
    scraper_user_agent: str = Field(
        default="FoodPlatformBot/0.1 (+contact: admin@example.com)",
        alias="SCRAPER_USER_AGENT",
    )
    scrape_max_items_per_source: int = Field(default=250, alias="SCRAPE_MAX_ITEMS_PER_SOURCE")
    spar2u_enabled: bool = Field(default=True, alias="SPAR2U_ENABLED")
    glomark_enabled: bool = Field(default=True, alias="GLOMARK_ENABLED")
    market_quotes_url: str = Field(default="", alias="MARKET_QUOTES_URL")
    market_quotes_timeout_seconds: float = Field(default=15.0, alias="MARKET_QUOTES_TIMEOUT_SECONDS")
    market_quotes_format: str = Field(default="json", alias="MARKET_QUOTES_FORMAT")
    market_quotes_seed_fallback_enabled: bool = Field(default=True, alias="MARKET_QUOTES_SEED_FALLBACK_ENABLED")

    @property
    def cors_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development_like(self) -> bool:
        normalized = self.app_env.strip().lower()
        return normalized in {"dev", "development", "local", "test", "testing"}

    @property
    def is_production_like(self) -> bool:
        normalized = self.app_env.strip().lower()
        return normalized in {"prod", "production", "staging", "stage"}

    @property
    def resolved_database_url(self) -> str:
        configured_url = self.database_url.strip()
        if configured_url:
            if configured_url.startswith("sqlite") and self.is_production_like:
                raise ValueError("SQLite is not allowed in production-like environments.")
            if configured_url.startswith("sqlite") and not self.allow_sqlite_fallback:
                raise ValueError("SQLite is not allowed when ALLOW_SQLITE_FALLBACK is false.")
            return configured_url

        if self.allow_sqlite_fallback and self.is_development_like:
            return SQLITE_DEFAULT_URL

        raise ValueError(
            "DATABASE_URL must be set for non-development environments or when SQLite fallback is disabled."
        )

    @property
    def has_insecure_admin_key(self) -> bool:
        return self.admin_api_key.strip() in {"", "change-me"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
