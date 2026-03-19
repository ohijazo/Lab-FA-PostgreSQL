"""
Import blats_export.json into the 'blats' analysis type.

Uses positional mapping per section to handle duplicate JSON keys
(FN (s) x3, IMPURESES x4, Especificacions W/W, P/L/P/L, idp/idp).

Usage:
    cd backend
    python import_blats.py
"""

import json
import re
from datetime import datetime

from app import create_app, db
from app.models import Analisi


# Positional mapping: for each section, list of DB field names in order
SECTION_MAPPING = {
    "Identificació": [
        "data", "codi", "analista", "proveidor", "sitja_origen",
        "tipus_blat", "num_tiquet", "Ordre_compra", "varietat",
    ],
    "Resultats anàlisis farina": [
        "w28min", "pl28min", "P28min", "l28min",
        "w2h", "pl2h", "p2h", "l2h", "idp2h",
        "humit_perc", "prot_perc",
        "fns1_farina", "fns2_farina", "fns3_farina",
    ],
    "Resultats NIR": [
        "cendres_nir", "ghumit", "absorcio",
    ],
    "Observacions": [
        "observacions",
    ],
    "Resultats anàlisis blat": [
        "fns1", "fns2", "fns3",
        "pes_espec_perc", "humitat_perc", "prot_perc", "cendres",
        "altres_cereals",
        "impureses_pes_blat_brut", "impureses_pes_blat_net",
        "impureses", "impureses_perc",
        "rendiment_pes_blat_humitat", "rendiment_pes_semola",
        "rendiment_semola2", "rendiment_pes_farina", "rendiment_perc",
        "micotoxines_don", "micotoxines_zea", "micotoxines_ocra",
    ],
    "Especificacions": [
        "especificacions_w1", "especificacions_w2",
        "especificacions_pl1", "especificacions_pl2",
        "especificacions_idp1", "especificacions_idp2",
    ],
    "Responsable entrada camió": [
        "resp_entrada_camio",
    ],
}


def convert_date(val):
    """Convert dd/mm/yyyy to yyyy-mm-dd."""
    if not val or val.strip() == "-":
        return ""
    val = val.strip()
    # dd/mm/yyyy
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", val)
    if m:
        d, mo, y = m.groups()
        return f"{y}-{mo.zfill(2)}-{d.zfill(2)}"
    return val


def parse_record(record_pairs):
    """Parse a single record (list of (section_name, field_pairs)) into flat dict."""
    dades = {}

    for section_name, fields in record_pairs:
        mapping = SECTION_MAPPING.get(section_name)
        if not mapping:
            continue

        if section_name == "Observacions":
            # Single value field
            if fields:
                _, val = fields[0]
                dades["observacions"] = val.strip() if val else ""
            continue

        if section_name == "Responsable entrada camió":
            if fields:
                _, val = fields[0]
                dades["resp_entrada_camio"] = val.strip() if val else ""
            continue

        # Map by position
        for i, (_, val) in enumerate(fields):
            if i >= len(mapping):
                break
            field_name = mapping[i]
            val = val.strip() if isinstance(val, str) else str(val) if val is not None else ""

            # Convert dates
            if field_name == "data":
                val = convert_date(val)

            dades[field_name] = val

    return dades


class DupDecoder(json.JSONDecoder):
    """JSON decoder that preserves duplicate keys as list of tuples."""
    def __init__(self, **kwargs):
        super().__init__(object_pairs_hook=self._pairs_hook, **kwargs)

    def _pairs_hook(self, pairs):
        return pairs


def main():
    app = create_app()

    with open("../blats_export.json", "r", encoding="latin-1") as f:
        records = json.load(f, cls=DupDecoder)

    print(f"Registres al fitxer: {len(records)}")

    with app.app_context():
        # Check existing count
        existing = Analisi.query.filter_by(tipus="blats").count()
        print(f"Registres existents a BD: {existing}")

        imported = 0
        errors = 0

        for idx, record_pairs in enumerate(records):
            try:
                dades = parse_record(record_pairs)

                a = Analisi(tipus="blats")
                a.set_dades(dades)

                # Set created_at from data field if available
                data_str = dades.get("data", "")
                if data_str and re.match(r"^\d{4}-\d{2}-\d{2}$", data_str):
                    a.created_at = datetime.strptime(data_str, "%Y-%m-%d")

                db.session.add(a)
                imported += 1

            except Exception as e:
                errors += 1
                print(f"  Error registre #{idx + 1}: {e}")

        db.session.commit()
        total = Analisi.query.filter_by(tipus="blats").count()
        print(f"\nImportats: {imported}")
        print(f"Errors: {errors}")
        print(f"Total registres blats a BD: {total}")


if __name__ == "__main__":
    main()
