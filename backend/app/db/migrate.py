from pathlib import Path

from alembic import command
from alembic.config import Config


def run_upgrade(revision: str = "head") -> None:
    base_dir = Path(__file__).resolve().parents[2]
    config = Config(str(base_dir / "alembic.ini"))
    config.set_main_option("script_location", str(base_dir / "alembic"))
    command.upgrade(config, revision)
