from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = Field(default="development", alias="APP_ENV")
    app_name: str = Field(default="Food Price Intelligence API", alias="APP_NAME")
    api_prefix: str = Field(default="/api/v1", alias="API_PREFIX")
    admin_api_key: str = Field(default="change-me", alias="ADMIN_API_KEY")
    allow_sqlite_fallback: bool = Field(default=True, alias="ALLOW_SQLITE_FALLBACK")
    database_url: str = Field(default="sqlite:///./food_platform.db", alias="DATABASE_URL")
    cors_origins: str = Field(default="http://localhost:5173,http://127.0.0.1:5173", alias="CORS_ORIGINS")
    scraper_user_agent: str = Field(
        default="FoodPlatformBot/0.1 (+contact: admin@example.com)",
        alias="SCRAPER_USER_AGENT",
    )
    scrape_max_items_per_source: int = Field(default=250, alias="SCRAPE_MAX_ITEMS_PER_SOURCE")
    spar2u_enabled: bool = Field(default=True, alias="SPAR2U_ENABLED")
    glomark_enabled: bool = Field(default=True, alias="GLOMARK_ENABLED")

    @property
    def cors_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
