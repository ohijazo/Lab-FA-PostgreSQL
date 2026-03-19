"""
Migra les dades de la taula analisi_blat_t1 (columnes fixes)
a la nova taula analisi (JSON genèric).

Ús:  python migrate_to_multi.py
"""
import json
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "lab.db")

SKIP_COLS = {"id", "created_at"}


def migrate():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Check if old table exists
    cur = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='analisi_blat_t1'"
    )
    if not cur.fetchone():
        print("No hi ha taula analisi_blat_t1, res a migrar.")
        conn.close()
        return

    # Create new table if it doesn't exist
    conn.execute("""
        CREATE TABLE IF NOT EXISTS analisi (
            id          INTEGER PRIMARY KEY,
            tipus       TEXT NOT NULL,
            created_at  DATETIME,
            updated_at  DATETIME,
            dades       TEXT NOT NULL DEFAULT '{}'
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS ix_analisi_tipus ON analisi (tipus)")

    # Read all rows from old table
    rows = conn.execute("SELECT * FROM analisi_blat_t1").fetchall()
    cols = rows[0].keys() if rows else []

    migrated = 0
    for row in rows:
        dades = {}
        for col in cols:
            if col in SKIP_COLS:
                continue
            val = row[col]
            if val is not None:
                dades[col] = val

        conn.execute(
            "INSERT INTO analisi (id, tipus, created_at, updated_at, dades) VALUES (?, ?, ?, ?, ?)",
            (row["id"], "blat_t1", row["created_at"], row["created_at"], json.dumps(dades, ensure_ascii=False)),
        )
        migrated += 1

    conn.commit()
    print(f"Migrats {migrated} registres de analisi_blat_t1 -> analisi.")

    # Rename old table as backup
    conn.execute("ALTER TABLE analisi_blat_t1 RENAME TO analisi_blat_t1_backup")
    conn.commit()
    print("Taula antiga renombrada a analisi_blat_t1_backup.")

    conn.close()


if __name__ == "__main__":
    migrate()
