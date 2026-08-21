"""
Esborrar TOTES les analisis de la base de dades.

Us:  python delete_all_analisis.py

ATENCIO: aquest script es destructiu. Nomes toca la taula 'analisi'
(les taules 'tipus_analisi', 'seccio' i 'camp' NO es modifiquen).
Els registres relacionats a 'email_log' i 'edit_lock' s'esborraran
automaticament (ON DELETE CASCADE).

Doble confirmacio interactiva. No hi ha flag --force.
"""
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app import create_app, db
from app.models import Analisi


CONFIRMACIO_FINAL = "ESBORRAR TOTES LES ANALISIS"


def delete_all():
    app = create_app()
    with app.app_context():
        analisis = Analisi.query.all()
        total = len(analisis)

        if total == 0:
            print("No hi ha cap analisi a la BD. Res a fer.")
            return

        per_tipus = Counter(a.tipus for a in analisis)
        print(f"Trobades {total} analisis a la BD:")
        for t, n in sorted(per_tipus.items()):
            print(f"  {t}: {n}")
        print()

        r1 = input("Has fet backup abans? Escriu 'SI' per continuar: ").strip()
        if r1 != "SI":
            print("Cancellat: no s'ha confirmat el backup.")
            return

        print()
        print("Aquesta accio ESBORRARA totes les analisis de forma irreversible.")
        r2 = input(f"Escriu literalment '{CONFIRMACIO_FINAL}' per confirmar: ").strip()
        if r2 != CONFIRMACIO_FINAL:
            print("Cancellat: confirmacio final incorrecta.")
            return

        try:
            n_deleted = Analisi.query.delete()
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"ERROR: {e}")
            print("La BD no s'ha modificat.")
            raise

        restants = Analisi.query.count()
        print()
        print(f"Esborrades {n_deleted} analisis.")
        print(f"Total actual a la taula 'analisi': {restants}")
        if restants != 0:
            print("ATENCIO: la taula no ha quedat buida. Revisa manualment.")


if __name__ == "__main__":
    delete_all()
