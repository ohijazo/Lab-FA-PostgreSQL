"""
Seed: crea el tipus Blats T1 amb les seves seccions i camps a la BD.

Us:  python seed.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import TipusAnalisi, Seccio, Camp


BLATS_T1 = {
    "nom": "Blats T1",
    "slug": "blats_t1",
    "descripcio": "Analisi de blats tou tipus 1",
    "columnes_llista": ["data", "codi", "analista", "bareja"],
    "seccions": [
        {
            "titol": "Identificacio",
            "camps": [
                {"name": "data", "label": "Data", "type": "date", "required": True},
                {"name": "codi", "label": "Codi", "type": "number", "required": True},
                {"name": "analista", "label": "Analista", "type": "text"},
                {"name": "bareja", "label": "Bareja", "type": "text"},
                {"name": "codi_analisi_farina", "label": "Codi analisi farina proxima", "type": "text"},
            ],
        },
        {
            "titol": "Resultats analisi farina",
            "camps": [
                {"name": "min28_w", "label": "28 min W", "type": "number"},
                {"name": "min28_pl", "label": "28 min P/L", "type": "number"},
                {"name": "min28_p", "label": "28 min P", "type": "number"},
                {"name": "min28_l", "label": "28 min L", "type": "number"},
                {"name": "humitat", "label": "Hum. %", "type": "number"},
                {"name": "proteina", "label": "Prot %", "type": "number"},
            ],
        },
        {
            "titol": "Resultats NIR",
            "camps": [
                {"name": "nir_cendres", "label": "Cendres", "type": "number"},
                {"name": "nir_ghumit", "label": "Ghumit", "type": "number"},
                {"name": "nir_absorcio", "label": "Absorcio", "type": "number"},
            ],
        },
        {
            "titol": "Observacions",
            "camps": [
                {"name": "observacions", "label": "Observacions", "type": "textarea"},
            ],
        },
        {
            "titol": "Pes inicial",
            "camps": [
                {"name": "pes_inicial", "label": "Pes inicial", "type": "number"},
            ],
        },
        {
            "titol": "Trituracio",
            "camps": [
                {"name": "trit_farina", "label": "Farina", "type": "number"},
                {"name": "trit_r_farina", "label": "R. farina %", "type": "number"},
                {"name": "trit_semola", "label": "Semola", "type": "number"},
                {"name": "trit_r_semola", "label": "R. Semola %", "type": "number"},
                {"name": "trit_sego", "label": "Sego", "type": "number"},
                {"name": "trit_r_sego", "label": "R. Sego %", "type": "number"},
            ],
        },
        {
            "titol": "Compressio",
            "camps": [
                {"name": "comp_farina", "label": "Farina", "type": "number"},
                {"name": "comp_r_farina", "label": "R Farina %", "type": "number"},
                {"name": "comp_sego", "label": "Sego", "type": "number"},
                {"name": "comp_r_sego", "label": "R. Sego %", "type": "number"},
            ],
        },
        {
            "titol": "Rendiment total Farina",
            "camps": [
                {"name": "rend_farina_pes", "label": "Pes total", "type": "number"},
                {"name": "rend_farina_r", "label": "R 55-60%", "type": "number"},
            ],
        },
        {
            "titol": "Rendiment total Sego",
            "camps": [
                {"name": "rend_sego_pes", "label": "Pes total", "type": "number"},
            ],
        },
        {
            "titol": "Rendiment Total Rendime",
            "camps": [
                {"name": "rend_total_r", "label": "R >98%", "type": "number"},
            ],
        },
    ],
}


def seed():
    app = create_app()
    with app.app_context():
        # Check if already seeded
        if TipusAnalisi.query.filter_by(slug=BLATS_T1["slug"]).first():
            print(f"Tipus '{BLATS_T1['slug']}' ja existeix, no es fa res.")
            return

        t = TipusAnalisi(
            nom=BLATS_T1["nom"],
            slug=BLATS_T1["slug"],
            descripcio=BLATS_T1["descripcio"],
        )
        t.set_columnes_llista(BLATS_T1["columnes_llista"])
        db.session.add(t)
        db.session.flush()

        for i, sec_data in enumerate(BLATS_T1["seccions"]):
            s = Seccio(tipus_id=t.id, titol=sec_data["titol"], ordre=i + 1)
            db.session.add(s)
            db.session.flush()

            for j, camp_data in enumerate(sec_data["camps"]):
                c = Camp(
                    seccio_id=s.id,
                    name=camp_data["name"],
                    label=camp_data["label"],
                    type=camp_data.get("type", "text"),
                    required=camp_data.get("required", False),
                    ordre=j + 1,
                )
                db.session.add(c)

        db.session.commit()
        print(f"Creat tipus '{BLATS_T1['nom']}' amb {len(BLATS_T1['seccions'])} seccions.")


if __name__ == "__main__":
    seed()
