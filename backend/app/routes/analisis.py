import io
from datetime import date, datetime
from functools import wraps
from flask import Blueprint, jsonify, request, abort, session, send_file
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter
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


def _build_export_sheet(ws, tipus_obj, analisis_list):
    """Build a worksheet with merged section headers (row 1) and camp labels (row 2)."""
    seccions_ordered = sorted(tipus_obj.seccions, key=lambda s: (s.ordre or 0))

    # Build structure: list of (seccio_titol, [(camp_name, camp_label), ...])
    seccio_camps = []
    for seccio in seccions_ordered:
        camps = sorted(seccio.camps, key=lambda c: (c.ordre or 0))
        if camps:
            seccio_camps.append((seccio.titol, [(c.name, c.label) for c in camps]))

    # Fixed columns before sections
    fixed_cols = 2  # ID, Data creació

    # Row 1: section headers (merged)
    # Row 2: camp labels
    section_header = Font(bold=True)
    center = Alignment(horizontal="center", vertical="center")

    # Write fixed column headers spanning both rows
    ws.cell(row=1, column=1, value="ID").font = section_header
    ws.merge_cells(start_row=1, start_column=1, end_row=2, end_column=1)
    ws.cell(row=1, column=1).alignment = center

    ws.cell(row=1, column=2, value="Data creació").font = section_header
    ws.merge_cells(start_row=1, start_column=2, end_row=2, end_column=2)
    ws.cell(row=1, column=2).alignment = center

    col = fixed_cols + 1  # next column (1-indexed)
    all_camp_names = []
    for titol, camps in seccio_camps:
        num_camps = len(camps)
        # Merge section title across its camps in row 1
        ws.cell(row=1, column=col, value=titol).font = section_header
        ws.cell(row=1, column=col).alignment = center
        if num_camps > 1:
            ws.merge_cells(
                start_row=1, start_column=col,
                end_row=1, end_column=col + num_camps - 1,
            )
        # Write camp labels in row 2
        for i, (name, label) in enumerate(camps):
            ws.cell(row=2, column=col + i, value=label)
            all_camp_names.append(name)
        col += num_camps

    # Data rows starting from row 3
    for a in analisis_list:
        dades = a.dades if isinstance(a.dades, dict) else {}
        row = [
            a.id,
            a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "",
        ]
        for name in all_camp_names:
            row.append(dades.get(name, ""))
        ws.append(row)


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
        query = query.filter(Analisi.dades["data"].as_string() >= date_from)
    if date_to:
        query = query.filter(Analisi.dades["data"].as_string() <= date_to)
    query = query.order_by(Analisi.id.desc())
    analisis = query.all()

    wb = Workbook()
    ws = wb.active
    ws.title = t.nom

    if all_fields:
        _build_export_sheet(ws, t, analisis)
    else:
        # Simple export with columnes_llista only (no section headers)
        columnes = t.columnes_llista or []
        seccions_ordered = sorted(t.seccions, key=lambda s: (s.ordre or 0))
        camp_labels = {}
        for seccio in seccions_ordered:
            for camp in seccio.camps:
                camp_labels[camp.name] = camp.label
        headers = ["ID", "Data creació"] + [camp_labels.get(c, c) for c in columnes]
        ws.append(headers)
        for a in analisis:
            dades = a.dades if isinstance(a.dades, dict) else {}
            row = [a.id, a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else ""]
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


@bp.route("/api/analisis/export-multi", methods=["GET"])
@login_required
def exportar_multi():
    slugs = request.args.getlist("tipus")
    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()

    if not slugs:
        abort(400, description="Cal seleccionar almenys un tipus")

    tipus_list = TipusAnalisi.query.filter(TipusAnalisi.slug.in_(slugs)).all()
    if not tipus_list:
        abort(404, description="Cap tipus trobat")

    wb = Workbook()
    wb.remove(wb.active)  # Remove default empty sheet

    for t in sorted(tipus_list, key=lambda x: x.nom):
        query = Analisi.query.filter_by(tipus=t.slug)
        if date_from:
            query = query.filter(Analisi.dades["data"].as_string() >= date_from)
        if date_to:
            query = query.filter(Analisi.dades["data"].as_string() <= date_to)
        query = query.order_by(Analisi.id.desc())
        analisis = query.all()

        # Sheet title max 31 chars (Excel limit)
        ws = wb.create_sheet(title=t.nom[:31])
        _build_export_sheet(ws, t, analisis)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"analisis_{date.today().isoformat()}.xlsx"
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
