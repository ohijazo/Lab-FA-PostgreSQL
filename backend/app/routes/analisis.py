import io
from datetime import date, datetime
from functools import wraps
from flask import Blueprint, jsonify, request, abort, session, send_file
from openpyxl import Workbook
from app import db
from app.models import Analisi, TipusAnalisi

bp = Blueprint("analisis", __name__)


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "email" not in session:
            return jsonify({"error": "No autenticat"}), 401
        return f(*args, **kwargs)
    return decorated


def _get_tipus_or_404(slug):
    t = TipusAnalisi.query.filter_by(slug=slug).first()
    if not t:
        abort(404, description=f"Tipus '{slug}' no trobat")
    return t


# --------------- Config endpoints ---------------

@bp.route("/api/tipus", methods=["GET"])
@login_required
def llistar_tipus():
    tots = TipusAnalisi.query.order_by(TipusAnalisi.nom).all()
    return jsonify([t.to_dict() for t in tots])


@bp.route("/api/tipus/<slug>/config", methods=["GET"])
@login_required
def config_tipus(slug):
    t = _get_tipus_or_404(slug)
    return jsonify(t.to_config())


# --------------- CRUD endpoints ---------------

@bp.route("/api/analisis/<slug>", methods=["GET"])
@login_required
def llistar(slug):
    _get_tipus_or_404(slug)

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 25, type=int)
    q = request.args.get("q", "").strip().lower()
    sort = request.args.get("sort", "").strip()
    sort_dir = request.args.get("sort_dir", "desc").strip().lower()

    query = Analisi.query.filter_by(tipus=slug)

    if q:
        query = query.filter(
            Analisi.dades.cast(db.Text).ilike(f"%{q}%")
        )

    total = query.count()

    if sort:
        sort_expr = Analisi.dades[sort].as_string()
        if sort_dir == "desc":
            query = query.order_by(sort_expr.desc().nullslast())
        else:
            query = query.order_by(sort_expr.asc().nullsfirst())
    else:
        query = query.order_by(Analisi.id.desc())

    analisis = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "items": [a.to_dict() for a in analisis],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if per_page else 1,
    })


@bp.route("/api/analisis/<slug>/export", methods=["GET"])
@login_required
def exportar(slug):
    t = _get_tipus_or_404(slug)
    q = request.args.get("q", "").strip().lower()
    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()
    all_fields = request.args.get("all_fields", "0").strip() == "1"

    query = Analisi.query.filter_by(tipus=slug)
    if q:
        query = query.filter(Analisi.dades.cast(db.Text).ilike(f"%{q}%"))
    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Analisi.created_at >= dt_from)
        except ValueError:
            pass
    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(Analisi.created_at <= dt_to)
        except ValueError:
            pass
    query = query.order_by(Analisi.id.desc())
    analisis = query.all()

    # Build ordered list of all camps from config (secció.ordre → camp.ordre)
    seccions_ordered = sorted(t.seccions, key=lambda s: (s.ordre or 0))
    all_camps_ordered = []
    camp_labels = {}
    for seccio in seccions_ordered:
        for camp in sorted(seccio.camps, key=lambda c: (c.ordre or 0)):
            camp_labels[camp.name] = camp.label
            all_camps_ordered.append(camp.name)

    # Determine columns to export
    if all_fields:
        columnes = all_camps_ordered
    else:
        columnes = t.columnes_llista or []

    wb = Workbook()
    ws = wb.active
    ws.title = t.nom

    # Header row
    headers = ["ID", "Data creació"] + [camp_labels.get(c, c) for c in columnes]
    ws.append(headers)

    # Data rows
    for a in analisis:
        dades = a.dades if isinstance(a.dades, dict) else {}
        row = [
            a.id,
            a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "",
        ]
        for c in columnes:
            row.append(dades.get(c, ""))
        ws.append(row)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"{slug}_{date.today().isoformat()}.xlsx"
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=filename,
    )


@bp.route("/api/analisis/<slug>/<int:id>", methods=["GET"])
@login_required
def detall(slug, id):
    a = db.get_or_404(Analisi, id)
    if a.tipus != slug:
        abort(404)
    return jsonify(a.to_dict())


@bp.route("/api/analisis/<slug>", methods=["POST"])
@login_required
def crear(slug):
    _get_tipus_or_404(slug)

    data = request.get_json()
    for key in ("id", "created_at", "updated_at", "tipus", "created_by", "updated_by"):
        data.pop(key, None)

    a = Analisi(tipus=slug, created_by=session.get("email"), updated_by=session.get("email"))
    a.set_dades(data)
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201


@bp.route("/api/analisis/<slug>/<int:id>", methods=["PUT"])
@login_required
def editar(slug, id):
    a = db.get_or_404(Analisi, id)
    if a.tipus != slug:
        abort(404)

    data = request.get_json()
    for key in ("id", "created_at", "updated_at", "tipus", "created_by", "updated_by"):
        data.pop(key, None)

    a.set_dades(data)
    a.updated_by = session.get("email")
    db.session.commit()
    return jsonify(a.to_dict())


@bp.route("/api/analisis/<slug>/<int:id>", methods=["DELETE"])
@login_required
def eliminar(slug, id):
    a = db.get_or_404(Analisi, id)
    if a.tipus != slug:
        abort(404)
    db.session.delete(a)
    db.session.commit()
    return jsonify({"ok": True})
