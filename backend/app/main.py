from collections import defaultdict, deque
from contextlib import asynccontextmanager
from time import monotonic

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.migrate import run_upgrade
from app.db.session import verify_database_connection

settings = get_settings()
_rate_buckets: dict[str, deque[float]] = defaultdict(deque)


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


@app.middleware("http")
async def rate_limit_api(request: Request, call_next):
    if request.url.path.startswith(settings.api_prefix) and settings.api_rate_limit_per_minute > 0:
        client = request.client.host if request.client else "unknown"
        now = monotonic()
        key = f"{client}:{request.url.path}"
        bucket = _rate_buckets[key]
        while bucket and now - bucket[0] > 60:
            bucket.popleft()
        if len(bucket) >= settings.api_rate_limit_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "API rate limit exceeded. Retry after a short cooldown."},
                headers={"Retry-After": "60"},
            )
        bucket.append(now)
    return await call_next(request)


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
