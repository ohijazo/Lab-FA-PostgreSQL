"""
Migra dades de SQLite (lab.db) a PostgreSQL.

Ús:
  cd backend
  venv\Scripts\activate
  flask db upgrade          # Crear taules primer
  python migrate_sqlite_to_pg.py
"""
import json
import os
import sqlite3
import sys

from dotenv import load_dotenv
load_dotenv()

from app import create_app, db
from app.models import TipusAnalisi, Seccio, Camp, Analisi, User


SQLITE_PATH = os.path.join(os.path.dirname(__file__), "lab.db")


def migrate():
    if not os.path.exists(SQLITE_PATH):
        print(f"No s'ha trobat {SQLITE_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row

    app = create_app()
    with app.app_context():
        _migrate_users(conn)
        _migrate_tipus(conn)
        _migrate_seccions(conn)
        _migrate_camps(conn)
        _migrate_analisis(conn)
        _reset_sequences()

    conn.close()
    print("\nMigracio completada!")


def _migrate_users(conn):
    rows = conn.execute("SELECT * FROM user").fetchall()
    if not rows:
        print("Users: cap registre a SQLite")
        return

    existing = {u.email for u in User.query.all()}
    count = 0
    for r in rows:
        email = r["email"]
        if email in existing:
            continue
        u = User(
            id=r["id"],
            email=email,
            nom=r["nom"] if "nom" in r.keys() else "",
            password_hash=r["password_hash"],
            role=r["role"] if "role" in r.keys() else "user",
        )
        db.session.add(u)
        count += 1
    db.session.commit()
    print(f"Users: {count} migrats")


def _migrate_tipus(conn):
    rows = conn.execute("SELECT * FROM tipus_analisi").fetchall()
    existing = {t.id for t in TipusAnalisi.query.all()}
    count = 0
    for r in rows:
        if r["id"] in existing:
            continue
        col_llista = r["columnes_llista"]
        if isinstance(col_llista, str):
            col_llista = json.loads(col_llista)
        t = TipusAnalisi(
            id=r["id"],
            nom=r["nom"],
            slug=r["slug"],
            descripcio=r["descripcio"] or "",
            columnes_llista=col_llista or [],
        )
        db.session.add(t)
        count += 1
    db.session.commit()
    print(f"Tipus: {count} migrats")


def _migrate_seccions(conn):
    rows = conn.execute("SELECT * FROM seccio").fetchall()
    existing = {s.id for s in Seccio.query.all()}
    count = 0
    for r in rows:
        if r["id"] in existing:
            continue
        s = Seccio(
            id=r["id"],
            tipus_id=r["tipus_id"],
            titol=r["titol"],
            ordre=r["ordre"] or 0,
        )
        db.session.add(s)
        count += 1
    db.session.commit()
    print(f"Seccions: {count} migrades")


def _migrate_camps(conn):
    rows = conn.execute("SELECT * FROM camp").fetchall()
    existing = {c.id for c in Camp.query.all()}
    count = 0
    for r in rows:
        if r["id"] in existing:
            continue
        c = Camp(
            id=r["id"],
            seccio_id=r["seccio_id"],
            name=r["name"],
            label=r["label"],
            type=r["type"] or "text",
            required=bool(r["required"]),
            ordre=r["ordre"] or 0,
            grup=r["grup"] if "grup" in r.keys() else "",
        )
        db.session.add(c)
        count += 1
    db.session.commit()
    print(f"Camps: {count} migrats")


def _migrate_analisis(conn):
    rows = conn.execute("SELECT * FROM analisi").fetchall()
    existing = {a.id for a in db.session.query(Analisi.id).all()}
    count = 0
    for r in rows:
        if r["id"] in existing:
            continue
        dades = r["dades"]
        if isinstance(dades, str):
            dades = json.loads(dades)

        a = Analisi(
            id=r["id"],
            tipus=r["tipus"],
            created_at=r["created_at"],
            updated_at=r["updated_at"],
            dades=dades or {},
            created_by=r["created_by"] if "created_by" in r.keys() else None,
            updated_by=r["updated_by"] if "updated_by" in r.keys() else None,
        )
        db.session.add(a)
        count += 1

        if count % 500 == 0:
            db.session.commit()
            print(f"  Analisis: {count} processades...")

    db.session.commit()
    print(f"Analisis: {count} migrades")


def _reset_sequences():
    """Reseteja les seqüències de PostgreSQL per continuar des del max id."""
    tables = [
        ("user", "user_id_seq"),
        ("tipus_analisi", "tipus_analisi_id_seq"),
        ("seccio", "seccio_id_seq"),
        ("camp", "camp_id_seq"),
        ("analisi", "analisi_id_seq"),
    ]
    for table, seq in tables:
        result = db.session.execute(
            db.text(f"SELECT COALESCE(MAX(id), 0) FROM \"{table}\"")
        ).scalar()
        if result:
            db.session.execute(
                db.text(f"SELECT setval('{seq}', {result})")
            )
    db.session.commit()
    print("Seqüencies resetejades")


if __name__ == "__main__":
    migrate()
