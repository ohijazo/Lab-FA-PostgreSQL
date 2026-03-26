from collections import defaultdict
from datetime import datetime
from functools import wraps

from flask import Blueprint, jsonify, request, session
from sqlalchemy import func

from app import db
from app.models import Analisi, TipusAnalisi, User
from app.i18n import t as tr

bp = Blueprint("dashboard", __name__)


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "email" not in session:
            return jsonify({"error": tr('no_autenticat')}), 401
        return f(*args, **kwargs)
    return decorated


@bp.route("/api/dashboard/global")
@login_required
def dashboard_global():
    """Estadístiques agregades de tots els tipus."""
    # All types
    all_tipus = TipusAnalisi.query.order_by(TipusAnalisi.nom).all()
    tipus_map = {t.slug: t for t in all_tipus}

    # Load all analyses with their data field for date-based stats
    all_analisis = Analisi.query.with_entities(
        Analisi.id, Analisi.tipus, Analisi.created_at,
        Analisi.dades, Analisi.created_by, Analisi.updated_at,
        Analisi.updated_by,
    ).order_by(Analisi.created_at.desc()).all()

    # Current month/year prefixes
    now = datetime.utcnow()
    current_month = now.strftime("%Y-%m")
    current_year = now.strftime("%Y")

    # Valid slugs (only count analyses that belong to existing types)
    valid_slugs = {t.slug for t in all_tipus}

    # Aggregate per type using dades->'data' field
    per_type_total = defaultdict(int)
    per_type_mes = defaultdict(int)
    per_type_any = defaultdict(int)
    per_type_ultima = {}  # slug -> latest data date string

    for row in all_analisis:
        slug = row.tipus
        if slug not in valid_slugs:
            continue
        dades = row.dades or {}
        data_val = dades.get("data", "")

        per_type_total[slug] += 1

        # Date checks on the 'data' field (format YYYY-MM-DD)
        if isinstance(data_val, str) and len(data_val) >= 7:
            if data_val[:7] == current_month:
                per_type_mes[slug] += 1
            if data_val[:4] == current_year:
                per_type_any[slug] += 1
            # Track latest date per type
            if slug not in per_type_ultima or data_val > per_type_ultima[slug]:
                per_type_ultima[slug] = data_val

    total_analisis = sum(per_type_total.values())
    analisis_mes = sum(per_type_mes.values())
    analisis_any = sum(per_type_any.values())
    ultima_global = max(per_type_ultima.values()) if per_type_ultima else None

    # Per-type stats
    per_tipus = []
    for t in all_tipus:
        ultima = per_type_ultima.get(t.slug)
        per_tipus.append({
            "slug": t.slug,
            "nom": t.nom,
            "descripcio": t.descripcio or "",
            "total": per_type_total.get(t.slug, 0),
            "mes_actual": per_type_mes.get(t.slug, 0),
            "any_actual": per_type_any.get(t.slug, 0),
            "ultima": ultima,
        })

    # Recent activity: last 10 analyses — include full row data
    activitat = []
    # Collect columnes_llista + labels per type for the frontend
    columnes_per_tipus = {}
    for t in all_tipus:
        cols = t.get_columnes_llista()
        # Build label map from seccions/camps
        label_map = {}
        for s in t.seccions:
            for c in s.camps:
                label_map[c.name] = c.label
        columnes_per_tipus[t.slug] = {"columnes": cols, "labels": label_map}

    # Map email -> nom for display
    email_to_nom = {u.email: u.nom for u in User.query.all()}

    # Sort by updated_at for recent activity (most recently modified first)
    recent = sorted(
        [r for r in all_analisis if r.tipus in valid_slugs],
        key=lambda r: r.updated_at or r.created_at or datetime.min,
        reverse=True,
    )[:10]

    for row in recent:
        t = tipus_map.get(row.tipus)
        dades = row.dades or {}
        entry = dict(dades)
        entry["id"] = row.id
        entry["tipus_slug"] = row.tipus
        entry["tipus_nom"] = t.nom if t else row.tipus
        entry["updated_at"] = row.updated_at.isoformat() if row.updated_at else None
        email = row.updated_by or row.created_by
        entry["updated_by"] = email_to_nom.get(email, email)
        activitat.append(entry)

    return jsonify({
        "total_analisis": total_analisis,
        "analisis_any_actual": analisis_any,
        "analisis_mes_actual": analisis_mes,
        "ultima_analisi": ultima_global,
        "per_tipus": per_tipus,
        "activitat_recent": activitat,
        "columnes_per_tipus": columnes_per_tipus,
    })


def _get_config(slug):
    """Load type config: numeric fields, text fields for grouping, main metrics."""
    t = TipusAnalisi.query.filter_by(slug=slug).first()
    if not t:
        return None

    numeric_fields = []  # (name, label)
    text_fields = []     # (name, label) — candidates for grouping
    all_fields = {}      # name -> label
    field_seccio = {}    # name -> seccio titol

    # Labels to exclude from KPI cards (identification/metadata fields)
    kpi_exclude_labels = {
        "codi", "nº tiguet", "nº tiquet", "analista", "farina", "lot", "fabrica",
        "sitja", "observacions", "proveïdor", "sitja origen",
        "tipus de blat", "varietat", "ordre de compra",
        "responsable entrada camió", "data",
    }

    for s in sorted(t.seccions, key=lambda x: (x.ordre or 0)):
        for c in sorted(s.camps, key=lambda x: (x.ordre or 0)):
            all_fields[c.name] = c.label
            field_seccio[c.name] = s.titol
            excluded = c.label.strip().lower() in kpi_exclude_labels
            if c.type == "number" and not excluded:
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
    priority = ["proveidor", "farina", "nom_farina", "fabrica", "nom_fabrica", "tipus_blat"]
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

    filter_fields = group_fields[:] if group_fields else []

    return {
        "nom": t.nom,
        "numeric_fields": numeric_fields,
        "text_fields": text_fields,
        "all_fields": all_fields,
        "metric_keys": metric_keys[:4],
        "group_fields": group_fields,
        "field_seccio": field_seccio,
        "filter_fields": filter_fields,
    }


def _load_filtered_analisis(slug, filter_fields, data_inici, data_fi, filter_vals):
    """Load filtered analisis as list of (id, dades dict).
    filter_vals is a dict {field_name: value}."""
    query = Analisi.query.filter_by(tipus=slug)

    if data_inici:
        query = query.filter(Analisi.dades["data"].as_string() >= data_inici)
    if data_fi:
        query = query.filter(Analisi.dades["data"].as_string() <= data_fi)
    for ff in filter_fields:
        val = filter_vals.get(ff, "")
        if val:
            query = query.filter(Analisi.dades[ff].as_string() == val)

    rows = query.with_entities(Analisi.id, Analisi.dades).all()
    return [(r[0], r[1] or {}) for r in rows]


@bp.route("/api/dashboard/<slug>")
@login_required
def dashboard(slug):
    config = _get_config(slug)
    if not config:
        return jsonify({"error": tr('tipus_no_trobat', slug=slug)}), 404

    data_inici = request.args.get("data_inici")
    data_fi = request.args.get("data_fi")

    filter_fields = config["filter_fields"]
    numeric_fields = config["numeric_fields"]
    metric_keys = config["metric_keys"]
    group_fields = config["group_fields"]
    all_labels = config["all_fields"]
    field_seccio = config["field_seccio"]

    # Collect filter values from query params (filtre_<fieldname>=value)
    filter_vals = {}
    for ff in filter_fields:
        val = request.args.get(f"filtre_{ff}", "").strip()
        if val:
            filter_vals[ff] = val

    # Filter options per field — each field's options are filtered by the
    # OTHER active filters (+ date range), so selections cascade dynamically.
    filters_info = []
    for ff in filter_fields:
        opts_query = db.session.query(
            Analisi.dades[ff].as_string()
        ).filter(
            Analisi.tipus == slug,
            Analisi.dades[ff].as_string().isnot(None),
            Analisi.dades[ff].as_string() != "",
            Analisi.dades[ff].as_string() != "-",
        )
        # Apply OTHER filters (not the current one)
        for other_ff in filter_fields:
            if other_ff != ff:
                other_val = filter_vals.get(other_ff, "")
                if other_val:
                    opts_query = opts_query.filter(
                        Analisi.dades[other_ff].as_string() == other_val
                    )
        # Apply date range
        if data_inici:
            opts_query = opts_query.filter(Analisi.dades["data"].as_string() >= data_inici)
        if data_fi:
            opts_query = opts_query.filter(Analisi.dades["data"].as_string() <= data_fi)
        options = sorted(r[0] for r in opts_query.distinct().all() if r[0])
        filters_info.append({
            "field": ff,
            "label": all_labels.get(ff, ff),
            "options": options,
        })

    # Load filtered data
    records = _load_filtered_analisis(slug, filter_fields, data_inici, data_fi, filter_vals)
    total = len(records)

    empty_response = {
        "nom": config["nom"],
        "total_registres": 0,
        "rang_dates": {"min": None, "max": None},
        "kpis": {},
        "kpi_order": [],
        "groups": {},
        "serie_temporal": {},
        "metric_keys": metric_keys,
        "metric_labels": {mk: all_labels.get(mk, mk) for mk in metric_keys},
        "field_seccio": field_seccio,
        "filters": filters_info,
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

    # Build KPIs (preserve field order from config)
    kpis = {}
    kpi_order = []
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
            kpi_order.append(name)

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
        "nom": config["nom"],
        "total_registres": total,
        "rang_dates": rang_dates,
        "kpis": kpis,
        "kpi_order": kpi_order,
        "groups": groups_out,
        "serie_temporal": serie_temporal,
        "metric_keys": metric_keys,
        "metric_labels": metric_labels,
        "field_seccio": field_seccio,
        "filters": filters_info,
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
