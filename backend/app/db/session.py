from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()
database_url = settings.resolved_database_url

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}

engine = create_engine(database_url, future=True, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_database_connection() -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def get_database_provider_status() -> dict[str, object]:
    db_url = engine.url
    backend = db_url.get_backend_name()
    host = (db_url.host or "").lower()
    is_supabase = backend.startswith("postgresql") and "supabase" in host

    if backend.startswith("sqlite"):
        provider = "sqlite"
    elif is_supabase:
        provider = "supabase-postgres"
    elif backend.startswith("postgresql"):
        provider = "postgres-compatible"
    else:
        provider = backend

    return {
        "provider": provider,
        "dialect": backend,
        "is_supabase_host": is_supabase,
        "host_hint": host.split(".")[-2:] if host else [],
        "database_present": bool(db_url.database),
    }