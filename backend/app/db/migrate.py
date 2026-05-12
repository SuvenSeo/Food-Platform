from pathlib import Path

from alembic import command
from alembic.config import Config

from app.core.config import get_settings


def run_upgrade(revision: str = "head") -> None:
    base_dir = Path(__file__).resolve().parents[2]
    config = Config(str(base_dir / "alembic.ini"))
    config.set_main_option("script_location", str(base_dir / "alembic"))
    config.set_main_option("sqlalchemy.url", get_settings().resolved_database_url)
    command.upgrade(config, revision)
