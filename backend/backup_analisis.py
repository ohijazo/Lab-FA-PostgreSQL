"""
Backup: exporta a JSON totes les analisis i la configuracio (tipus/seccions/camps).

Us:  python backup_analisis.py

Genera dos fitxers a backend/backups/:
  - analisis_YYYYMMDD_HHMMSS.json  (totes les analisis amb dades completes)
  - config_YYYYMMDD_HHMMSS.json    (tipus + seccions + camps, per referencia)

Nomes lectura. No modifica cap dada.
"""
import os
import sys
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import Analisi, TipusAnalisi


BACKUPS_DIR = os.path.join(os.path.dirname(__file__), "backups")


def _iso(dt):
    return dt.isoformat() if dt else None


def _serialize_analisi(a):
    return {
        "id": a.id,
        "tipus": a.tipus,
        "created_at": _iso(a.created_at),
        "updated_at": _iso(a.updated_at),
        "created_by": a.created_by,
        "updated_by": a.updated_by,
        "finalitzat": bool(a.finalitzat),
        "alerta": bool(a.alerta),
        "alerta_motiu": a.alerta_motiu or "",
        "apte": a.apte,
        "dades": a.dades or {},
    }


def _serialize_config():
    tipus = TipusAnalisi.query.order_by(TipusAnalisi.id).all()
    return [t.to_config() for t in tipus]


def backup():
    app = create_app()
    with app.app_context():
        os.makedirs(BACKUPS_DIR, exist_ok=True)

        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

        analisis = Analisi.query.order_by(Analisi.tipus, Analisi.id).all()
        analisis_payload = {
            "generated_at": datetime.utcnow().isoformat(),
            "total": len(analisis),
            "analisis": [_serialize_analisi(a) for a in analisis],
        }

        config_payload = {
            "generated_at": datetime.utcnow().isoformat(),
            "tipus": _serialize_config(),
        }

        analisis_path = os.path.join(BACKUPS_DIR, f"analisis_{ts}.json")
        config_path = os.path.join(BACKUPS_DIR, f"config_{ts}.json")

        with open(analisis_path, "w", encoding="utf-8") as f:
            json.dump(analisis_payload, f, ensure_ascii=False, indent=2)

        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config_payload, f, ensure_ascii=False, indent=2)

        per_tipus = {}
        for a in analisis:
            per_tipus[a.tipus] = per_tipus.get(a.tipus, 0) + 1

        print(f"Backup generat a {BACKUPS_DIR}")
        print(f"  - {os.path.basename(analisis_path)}  ({len(analisis)} analisis)")
        print(f"  - {os.path.basename(config_path)}   ({len(config_payload['tipus'])} tipus)")
        if per_tipus:
            print("Desglos per tipus:")
            for t, n in sorted(per_tipus.items()):
                print(f"  {t}: {n}")


if __name__ == "__main__":
    backup()
