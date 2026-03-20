"""Migració: afegir columna session_timeout a la taula user."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "lab.db")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Comprovar si la columna ja existeix
cur.execute("PRAGMA table_info(user)")
cols = [row[1] for row in cur.fetchall()]

if "session_timeout" not in cols:
    cur.execute("ALTER TABLE user ADD COLUMN session_timeout INTEGER NOT NULL DEFAULT 30")
    conn.commit()
    print("Columna session_timeout afegida correctament.")
else:
    print("La columna session_timeout ja existeix.")

conn.close()
