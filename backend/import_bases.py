"""
Importa bases_export.json a la BD:
1. Crea el tipus "Bases" amb seccions i camps
2. Importa tots els registres com a analisis

Us:  python import_bases.py
"""
import os
import sys
import json
import re
import unicodedata
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import TipusAnalisi, Seccio, Camp, Analisi

JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "bases_export.json")

# --- Helpers ---

def slugify(text):
    """Convert label to a valid field name: lowercase, no accents, underscores."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = text.strip("_")
    return text


# --- Definicio del tipus Bases ---
# Estructura extreta del JSON: 5 seccions amb els seus camps
# Cada camp te: name (slug auto), label (original del JSON), type

BASES_CONFIG = {
    "nom": "Bases",
    "slug": "bases",
    "descripcio": "Anàlisis de bases de farina",
    "columnes_llista": ["data", "codi", "analista", "farina"],
    "seccions": [
        {
            "titol": "Falling Number (1 per lot), anàlisis a 2 hores (1 per cada lot)",
            "camps": [
                {"name": "data", "label": "Data", "type": "date", "required": True},
                {"name": "codi", "label": "Codi", "type": "text", "required": True},
                {"name": "analista", "label": "Analista", "type": "text"},
                {"name": "farina", "label": "Farina", "type": "text"},
                {"name": "lot", "label": "Lot", "type": "text"},
                {"name": "sitja", "label": "Sitja", "type": "text"},
                {"name": "produccio_semola", "label": "Producció de sèmola (S/N)", "type": "text"},
                {"name": "fabrica", "label": "Fàbrica", "type": "text"},
                {"name": "rendiment", "label": "Rendiment (%)", "type": "text"},
                {"name": "rebuig_tamis", "label": "Rebuig =0,2 tamís metall 280µm (%)", "type": "text"},
                {"name": "rebuig_g", "label": "Rebuig (g)", "type": "text"},
            ],
        },
        {
            "titol": "Resultats anàlisis farina",
            "camps": [
                {"name": "w", "label": "W", "type": "text"},
                {"name": "pl", "label": "P/L", "type": "text"},
                {"name": "p", "label": "P", "type": "text"},
                {"name": "l", "label": "L", "type": "text"},
                {"name": "humitat", "label": "Hum. (%)", "type": "text"},
                {"name": "proteina", "label": "Prot. (%)", "type": "text"},
                {"name": "fn", "label": "FN (s)", "type": "text"},
                {"name": "gsec", "label": "Gsec", "type": "text"},
                {"name": "gindex", "label": "Gíndex", "type": "text"},
                {"name": "ghum", "label": "Ghum", "type": "text"},
                {"name": "pes_gluten_tamisat", "label": "Pes gluten tamisat (g)", "type": "text"},
                {"name": "pes_gluten_total", "label": "Pes gluten total (g)", "type": "text"},
                {"name": "pes_gluten_sec", "label": "Pes gluten sec (g)", "type": "text"},
            ],
        },
        {
            "titol": "Alveo 2 hores",
            "camps": [
                {"name": "alveo_w", "label": "W", "type": "text"},
            ],
        },
        {
            "titol": "Resultats NIR",
            "camps": [
                {"name": "nir_cendres", "label": "Cendres (%)", "type": "text"},
                {"name": "nir_ghumit", "label": "Ghumit (%)", "type": "text"},
                {"name": "nir_absorcio", "label": "Absorció (%)", "type": "text"},
            ],
        },
        {
            "titol": "Observacions",
            "camps": [
                {"name": "observacions", "label": "Observacions", "type": "textarea"},
            ],
        },
    ],
}

# Build label->name mapping per section title
# Key: (section_title_simplified, field_label) -> field_name
def build_label_map():
    """Build mapping from JSON labels to internal field names."""
    mapping = {}
    for sec in BASES_CONFIG["seccions"]:
        for camp in sec["camps"]:
            mapping[(sec["titol"], camp["label"])] = camp["name"]
    return mapping


def parse_date(date_str):
    """Parse dd/mm/yyyy to yyyy-mm-dd format."""
    if not date_str or date_str.strip() == "" or date_str.strip() == "-":
        return ""
    try:
        dt = datetime.strptime(date_str.strip(), "%d/%m/%Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        return date_str


def normalize_section_title(title):
    """Normalize section titles for matching between JSON and config."""
    # Remove extra whitespace
    return " ".join(title.split())


def import_bases():
    app = create_app()
    with app.app_context():
        # Check if already exists
        existing = TipusAnalisi.query.filter_by(slug="bases").first()
        if existing:
            print("El tipus 'bases' ja existeix. Vols continuar important dades? (s/n)")
            resp = input().strip().lower()
            if resp != "s":
                print("Cancel·lat.")
                return
        else:
            # Create tipus
            t = TipusAnalisi(
                nom=BASES_CONFIG["nom"],
                slug=BASES_CONFIG["slug"],
                descripcio=BASES_CONFIG["descripcio"],
            )
            t.set_columnes_llista(BASES_CONFIG["columnes_llista"])
            db.session.add(t)
            db.session.flush()

            for i, sec_data in enumerate(BASES_CONFIG["seccions"]):
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
            print(f"Creat tipus 'Bases' amb {len(BASES_CONFIG['seccions'])} seccions.")

        # Build mapping: for each section, map JSON label -> internal name
        # We need to match JSON section titles (which may have encoding diffs) to our config
        label_map = build_label_map()

        # Build a simplified mapping: normalize both sides
        # JSON sections -> config sections matching
        config_sections_by_norm = {}
        for sec in BASES_CONFIG["seccions"]:
            norm = normalize_section_title(sec["titol"])
            label_by_label = {}
            for camp in sec["camps"]:
                label_by_label[camp["label"]] = camp["name"]
            config_sections_by_norm[norm] = label_by_label

        # Load JSON data
        with open(JSON_PATH, "r", encoding="latin-1") as f:
            records = json.load(f)

        print(f"Llegits {len(records)} registres del JSON.")

        imported = 0
        errors = 0

        for idx, record in enumerate(records):
            dades = {}

            for json_section_title, fields in record.items():
                # Try to match section title
                norm_title = normalize_section_title(json_section_title)

                # Find matching config section
                matched_section = None
                for config_norm, config_labels in config_sections_by_norm.items():
                    # Compare ignoring encoding issues
                    if norm_title == config_norm:
                        matched_section = config_labels
                        break

                if matched_section is None:
                    # Try fuzzy: compare ASCII-only versions
                    norm_ascii = slugify(norm_title)
                    for config_norm, config_labels in config_sections_by_norm.items():
                        if slugify(config_norm) == norm_ascii:
                            matched_section = config_labels
                            break

                if matched_section is None:
                    if idx == 0:
                        print(f"  WARN: Seccio no trobada: '{json_section_title}'")
                    continue

                for label, value in fields.items():
                    # Find internal name for this label
                    internal_name = matched_section.get(label)
                    if internal_name is None:
                        # Try fuzzy match
                        label_ascii = slugify(label)
                        for config_label, config_name in matched_section.items():
                            if slugify(config_label) == label_ascii:
                                internal_name = config_name
                                break

                    if internal_name is None:
                        if idx == 0:
                            print(f"  WARN: Camp no trobat: '{label}' a seccio '{json_section_title}'")
                        continue

                    # Convert date fields
                    if internal_name == "data":
                        value = parse_date(value)

                    dades[internal_name] = value

            # Create analisi record
            analisi = Analisi(tipus="bases")
            analisi.set_dades(dades)

            # Try to set created_at from the data date
            if dades.get("data"):
                try:
                    analisi.created_at = datetime.strptime(dades["data"], "%Y-%m-%d")
                    analisi.updated_at = analisi.created_at
                except ValueError:
                    pass

            db.session.add(analisi)
            imported += 1

            if imported % 200 == 0:
                db.session.flush()
                print(f"  {imported} registres processats...")

        db.session.commit()
        print(f"\nImportació completada: {imported} registres importats.")


if __name__ == "__main__":
    import_bases()
