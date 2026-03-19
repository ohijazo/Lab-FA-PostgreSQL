from functools import wraps
from flask import Blueprint, jsonify, request, abort, session
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
