from sqlalchemy import text
from sqlalchemy.orm import Session


_ID_SEQUENCE_TABLES = {
    "scrape_runs",
    "raw_offers",
    "food_offers",
    "price_aggregates",
    "fair_price_scores",
    "alert_subscriptions",
    "market_quotes",
}


def sync_postgres_id_sequence(db: Session, table_name: str, id_column: str = "id") -> None:
    """Move a Postgres serial sequence past the current max(id).

    This is a no-op for SQLite/local tests. It protects production sync jobs
    from stale sequences after manual imports or SQLite-to-Postgres migrations.
    """
    bind = db.get_bind()
    if bind.dialect.name != "postgresql":
        return
    if table_name not in _ID_SEQUENCE_TABLES or id_column != "id":
        raise ValueError(f"Unsupported sequence target: {table_name}.{id_column}")

    db.execute(
        text("SELECT pg_advisory_xact_lock(hashtext(:lock_key))"),
        {"lock_key": f"food-platform:{table_name}:{id_column}:sequence"},
    )
    sequence_name = db.scalar(
        text("SELECT pg_get_serial_sequence(:table_name, :id_column)"),
        {"table_name": table_name, "id_column": id_column},
    )
    if not sequence_name:
        return

    quoted_table = f'"{table_name}"'
    quoted_column = f'"{id_column}"'
    db.execute(
        text(
            f"""
            SELECT setval(
                CAST(:sequence_name AS regclass),
                COALESCE((SELECT MAX({quoted_column}) FROM {quoted_table}), 0) + 1,
                false
            )
            """
        ),
        {"sequence_name": sequence_name},
    )
