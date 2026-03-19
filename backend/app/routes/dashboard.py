from collections import defaultdict

from flask import Blueprint, jsonify, request

from app import db
from app.models import Analisi, TipusAnalisi

bp = Blueprint("dashboard", __name__)


def _get_config(slug):
    """Load type config: numeric fields, text fields for grouping, main metrics."""
    t = TipusAnalisi.query.filter_by(slug=slug).first()
    if not t:
        return None

    numeric_fields = []  # (name, label)
    text_fields = []     # (name, label) — candidates for grouping
    all_fields = {}      # name -> label

    for s in t.seccions:
        for c in s.camps:
            all_fields[c.name] = c.label
            if c.type == "number":
                numeric_fields.append((c.name, c.label))
            elif c.type == "text":
                text_fields.append((c.name, c.label))

    # Detect main metrics for charts
    metric_keys = []
    for name, label in numeric_fields:
        low = name.lower()
        if any(k in low for k in ["w28", "w2h", "_w", "prot", "humit", "rendiment", "cendres"]):
            if name not in metric_keys:
                metric_keys.append(name)
    if len(metric_keys) < 4:
        for name, _ in numeric_fields:
            if name not in metric_keys:
                metric_keys.append(name)
            if len(metric_keys) >= 4:
                break

    # Detect group fields
    group_fields = []
    priority = ["farina", "nom_farina", "fabrica", "nom_fabrica", "tipus_blat", "proveidor"]
    for p in priority:
        if any(name == p for name, _ in text_fields):
            group_fields.append(p)
        if len(group_fields) >= 2:
            break
    if len(group_fields) < 2:
        for name, _ in text_fields:
            if name not in group_fields and name not in ("data", "observacions"):
                group_fields.append(name)
            if len(group_fields) >= 2:
                break

    filter_field = group_fields[0] if group_fields else None

    return {
        "numeric_fields": numeric_fields,
        "text_fields": text_fields,
        "all_fields": all_fields,
        "metric_keys": metric_keys[:4],
        "group_fields": group_fields,
        "filter_field": filter_field,
    }


def _load_filtered_analisis(slug, filter_field, data_inici, data_fi, filter_val):
    """Load filtered analisis as list of (id, dades dict)."""
    query = Analisi.query.filter_by(tipus=slug)

    if data_inici:
        query = query.filter(Analisi.dades["data"].as_string() >= data_inici)
    if data_fi:
        query = query.filter(Analisi.dades["data"].as_string() <= data_fi)
    if filter_val and filter_field:
        query = query.filter(Analisi.dades[filter_field].as_string() == filter_val)

    rows = query.with_entities(Analisi.id, Analisi.dades).all()
    return [(r[0], r[1] or {}) for r in rows]


@bp.route("/api/dashboard/<slug>")
def dashboard(slug):
    config = _get_config(slug)
    if not config:
        return jsonify({"error": "Tipus no trobat"}), 404

    data_inici = request.args.get("data_inici")
    data_fi = request.args.get("data_fi")
    filter_val = request.args.get("filtre", "").strip()

    filter_field = config["filter_field"]
    numeric_fields = config["numeric_fields"]
    metric_keys = config["metric_keys"]
    group_fields = config["group_fields"]
    all_labels = config["all_fields"]

    # Filter options (all unique values, unfiltered by filter_val)
    filter_options = []
    if filter_field:
        opts_query = db.session.query(
            Analisi.dades[filter_field].as_string()
        ).filter(
            Analisi.tipus == slug,
            Analisi.dades[filter_field].as_string().isnot(None),
            Analisi.dades[filter_field].as_string() != "",
            Analisi.dades[filter_field].as_string() != "-",
        ).distinct().all()
        filter_options = sorted(r[0] for r in opts_query if r[0])

    # Load filtered data
    records = _load_filtered_analisis(slug, filter_field, data_inici, data_fi, filter_val)
    total = len(records)

    empty_response = {
        "total_registres": 0,
        "rang_dates": {"min": None, "max": None},
        "kpis": {},
        "groups": {},
        "serie_temporal": {},
        "metric_keys": metric_keys,
        "metric_labels": {mk: all_labels.get(mk, mk) for mk in metric_keys},
        "filter_field": filter_field,
        "filter_label": all_labels.get(filter_field, filter_field) if filter_field else None,
        "filter_options": filter_options,
    }

    if not records:
        return jsonify(empty_response)

    # Aggregate in Python (efficient for <10K records)
    numeric_names = {name for name, _ in numeric_fields}

    # KPIs: accumulate per numeric field
    kpi_accum = defaultdict(list)  # field_name -> [float values]
    # Date range
    dates = []
    # Groups
    group_accum = {gf: defaultdict(lambda: {"count": 0, "metrics": defaultdict(list)}) for gf in group_fields}
    # Serie temporal
    month_accum = defaultdict(lambda: defaultdict(list))

    for _aid, dades in records:
        # Collect dates
        data_val = dades.get("data")
        if data_val and isinstance(data_val, str):
            dates.append(data_val)
            if len(data_val) >= 7:
                month = data_val[:7]
                for mk in metric_keys:
                    v = _parse_numeric(dades.get(mk))
                    if v is not None:
                        month_accum[month][mk].append(v)

        # KPIs
        for name in numeric_names:
            v = _parse_numeric(dades.get(name))
            if v is not None:
                kpi_accum[name].append(v)

        # Groups
        for gf in group_fields:
            group_label = all_labels.get(gf, gf)
            raw = dades.get(gf)
            gname = raw if raw and str(raw).strip() and str(raw).strip() != "-" else f"Sense {group_label.lower()}"
            group_accum[gf][gname]["count"] += 1
            for mk in metric_keys:
                v = _parse_numeric(dades.get(mk))
                if v is not None:
                    group_accum[gf][gname]["metrics"][mk].append(v)

    # Build KPIs
    kpis = {}
    for name, _ in numeric_fields:
        vals = kpi_accum.get(name)
        if vals:
            label = all_labels.get(name, name)
            kpis[name] = {
                "label": label,
                "avg": round(sum(vals) / len(vals), 2),
                "min": round(min(vals), 2),
                "max": round(max(vals), 2),
                "count": len(vals),
            }

    # Date range
    rang_dates = {"min": min(dates) if dates else None, "max": max(dates) if dates else None}

    # Build groups
    groups_out = {}
    for gf in group_fields:
        group_label = all_labels.get(gf, gf)
        group_data = {}
        for gname, info in sorted(group_accum[gf].items()):
            entry = {"count": info["count"]}
            for mk in metric_keys:
                vals = info["metrics"].get(mk, [])
                entry[mk] = round(sum(vals) / len(vals), 2) if vals else None
            group_data[gname] = entry
        groups_out[gf] = {"label": group_label, "data": group_data}

    # Build serie temporal
    serie_temporal = {}
    for month in sorted(month_accum.keys()):
        entry = {}
        for mk in metric_keys:
            vals = month_accum[month].get(mk, [])
            entry[mk] = round(sum(vals) / len(vals), 2) if vals else None
        serie_temporal[month] = entry

    metric_labels = {mk: all_labels.get(mk, mk) for mk in metric_keys}

    return jsonify({
        "total_registres": total,
        "rang_dates": rang_dates,
        "kpis": kpis,
        "groups": groups_out,
        "serie_temporal": serie_temporal,
        "metric_keys": metric_keys,
        "metric_labels": metric_labels,
        "filter_field": filter_field,
        "filter_label": all_labels.get(filter_field, filter_field) if filter_field else None,
        "filter_options": filter_options,
    })


def _parse_numeric(val):
    """Try to parse a value as float, return None if not possible."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        try:
            return float(val.strip().replace(",", "."))
        except (ValueError, TypeError):
            return None
    return None
