from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.migrate import run_upgrade
from app.db.session import verify_database_connection

settings = get_settings()


@asynccontextmanager
async def app_lifespan(_: FastAPI):
    verify_database_connection()
    run_upgrade()
    yield

app = FastAPI(
    title=settings.app_name,
    description="Sri Lanka food price intelligence API.",
    version="0.1.0",
    lifespan=app_lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    """Lightweight health check used by Fly.io and GitHub Actions warm-up."""
    return {"status": "ok"}
