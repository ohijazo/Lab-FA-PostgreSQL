import re
from functools import wraps
from flask import Blueprint, jsonify, request, abort, session
from app import db
from app.models import TipusAnalisi, Seccio, Camp, User

bp = Blueprint("admin", __name__)


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "email" not in session:
            return jsonify({"error": "No autenticat"}), 401
        if session.get("role") != "admin":
            return jsonify({"error": "Acces denegat"}), 403
        return f(*args, **kwargs)
    return decorated


def _slugify(text):
    text = text.lower().strip()
    text = re.sub(r"[àáâã]", "a", text)
    text = re.sub(r"[èéêë]", "e", text)
    text = re.sub(r"[ìíîï]", "i", text)
    text = re.sub(r"[òóôõ]", "o", text)
    text = re.sub(r"[ùúûü]", "u", text)
    text = re.sub(r"[ç]", "c", text)
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")


# ===================== TIPUS ANALISI =====================

@bp.route("/api/admin/tipus", methods=["GET"])
@admin_required
def llistar_tipus():
    tots = TipusAnalisi.query.order_by(TipusAnalisi.nom).all()
    return jsonify([t.to_dict() for t in tots])


@bp.route("/api/admin/tipus", methods=["POST"])
@admin_required
def crear_tipus():
    data = request.get_json()
    nom = data.get("nom", "").strip()
    if not nom:
        abort(400, description="El nom es obligatori")

    slug = data.get("slug") or _slugify(nom)
    if TipusAnalisi.query.filter_by(slug=slug).first():
        abort(409, description=f"Ja existeix un tipus amb slug '{slug}'")

    t = TipusAnalisi(
        nom=nom,
        slug=slug,
        descripcio=data.get("descripcio", ""),
    )
    if "columnes_llista" in data:
        t.set_columnes_llista(data["columnes_llista"])
    db.session.add(t)
    db.session.commit()
    return jsonify(t.to_dict()), 201


@bp.route("/api/admin/tipus/<int:id>", methods=["GET"])
@admin_required
def detall_tipus(id):
    t = db.get_or_404(TipusAnalisi, id)
    return jsonify(t.to_config())


@bp.route("/api/admin/tipus/<int:id>", methods=["PUT"])
@admin_required
def editar_tipus(id):
    t = db.get_or_404(TipusAnalisi, id)
    data = request.get_json()
    if "nom" in data:
        t.nom = data["nom"].strip()
    if "slug" in data:
        t.slug = data["slug"].strip()
    if "descripcio" in data:
        t.descripcio = data["descripcio"]
    if "columnes_llista" in data:
        t.set_columnes_llista(data["columnes_llista"])
    db.session.commit()
    return jsonify(t.to_dict())


@bp.route("/api/admin/tipus/<int:id>", methods=["DELETE"])
@admin_required
def eliminar_tipus(id):
    t = db.get_or_404(TipusAnalisi, id)
    db.session.delete(t)
    db.session.commit()
    return jsonify({"ok": True})


# ===================== SECCIONS =====================

@bp.route("/api/admin/tipus/<int:tipus_id>/seccions", methods=["GET"])
@admin_required
def llistar_seccions(tipus_id):
    db.get_or_404(TipusAnalisi, tipus_id)
    seccions = Seccio.query.filter_by(tipus_id=tipus_id).order_by(Seccio.ordre).all()
    return jsonify([s.to_dict() for s in seccions])


@bp.route("/api/admin/tipus/<int:tipus_id>/seccions", methods=["POST"])
@admin_required
def crear_seccio(tipus_id):
    db.get_or_404(TipusAnalisi, tipus_id)
    data = request.get_json()
    titol = data.get("titol", "").strip()
    if not titol:
        abort(400, description="El titol es obligatori")

    max_ordre = db.session.query(db.func.max(Seccio.ordre)).filter_by(tipus_id=tipus_id).scalar() or 0

    s = Seccio(
        tipus_id=tipus_id,
        titol=titol,
        ordre=data.get("ordre", max_ordre + 1),
    )
    db.session.add(s)
    db.session.commit()
    return jsonify(s.to_dict()), 201


@bp.route("/api/admin/tipus/<int:tipus_id>/seccions/reorder", methods=["PUT"])
@admin_required
def reordenar_seccions(tipus_id):
    db.get_or_404(TipusAnalisi, tipus_id)
    data = request.get_json()
    ordered_ids = data.get("order", [])
    for idx, sid in enumerate(ordered_ids):
        s = Seccio.query.get(sid)
        if s and s.tipus_id == tipus_id:
            s.ordre = idx
    db.session.commit()
    seccions = Seccio.query.filter_by(tipus_id=tipus_id).order_by(Seccio.ordre).all()
    return jsonify([s.to_dict() for s in seccions])


@bp.route("/api/admin/seccions/<int:id>", methods=["PUT"])
@admin_required
def editar_seccio(id):
    s = db.get_or_404(Seccio, id)
    data = request.get_json()
    if "titol" in data:
        s.titol = data["titol"].strip()
    if "ordre" in data:
        s.ordre = data["ordre"]
    db.session.commit()
    return jsonify(s.to_dict())


@bp.route("/api/admin/seccions/<int:id>", methods=["DELETE"])
@admin_required
def eliminar_seccio(id):
    s = db.get_or_404(Seccio, id)
    db.session.delete(s)
    db.session.commit()
    return jsonify({"ok": True})


# ===================== CAMPS =====================

@bp.route("/api/admin/seccions/<int:seccio_id>/camps", methods=["GET"])
@admin_required
def llistar_camps(seccio_id):
    db.get_or_404(Seccio, seccio_id)
    camps = Camp.query.filter_by(seccio_id=seccio_id).order_by(Camp.ordre).all()
    return jsonify([c.to_dict() for c in camps])


@bp.route("/api/admin/seccions/<int:seccio_id>/camps", methods=["POST"])
@admin_required
def crear_camp(seccio_id):
    db.get_or_404(Seccio, seccio_id)
    data = request.get_json()

    name = data.get("name", "").strip()
    label = data.get("label", "").strip()
    if not name or not label:
        abort(400, description="name i label son obligatoris")

    max_ordre = db.session.query(db.func.max(Camp.ordre)).filter_by(seccio_id=seccio_id).scalar() or 0

    c = Camp(
        seccio_id=seccio_id,
        name=name,
        label=label,
        type=data.get("type", "text"),
        required=data.get("required", False),
        ordre=data.get("ordre", max_ordre + 1),
        grup=data.get("grup", ""),
    )
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict()), 201


@bp.route("/api/admin/seccions/<int:seccio_id>/camps/reorder", methods=["PUT"])
@admin_required
def reordenar_camps(seccio_id):
    db.get_or_404(Seccio, seccio_id)
    data = request.get_json()
    ordered_ids = data.get("order", [])
    for idx, cid in enumerate(ordered_ids):
        c = Camp.query.get(cid)
        if c and c.seccio_id == seccio_id:
            c.ordre = idx
    db.session.commit()
    camps = Camp.query.filter_by(seccio_id=seccio_id).order_by(Camp.ordre).all()
    return jsonify([c.to_dict() for c in camps])


@bp.route("/api/admin/camps/<int:id>", methods=["PUT"])
@admin_required
def editar_camp(id):
    c = db.get_or_404(Camp, id)
    data = request.get_json()
    if "name" in data:
        c.name = data["name"].strip()
    if "label" in data:
        c.label = data["label"].strip()
    if "type" in data:
        c.type = data["type"]
    if "required" in data:
        c.required = data["required"]
    if "ordre" in data:
        c.ordre = data["ordre"]
    if "grup" in data:
        c.grup = data["grup"]
    db.session.commit()
    return jsonify(c.to_dict())


@bp.route("/api/admin/camps/<int:id>", methods=["DELETE"])
@admin_required
def eliminar_camp(id):
    c = db.get_or_404(Camp, id)
    db.session.delete(c)
    db.session.commit()
    return jsonify({"ok": True})


# ===================== USUARIS =====================

@bp.route("/api/admin/users", methods=["GET"])
@admin_required
def llistar_users():
    users = User.query.order_by(User.email).all()
    return jsonify([u.to_dict() for u in users])


@bp.route("/api/admin/users", methods=["POST"])
@admin_required
def crear_user():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    nom = data.get("nom", "").strip()
    password = data.get("password", "").strip()
    role = data.get("role", "user")

    if not email or not password:
        abort(400, description="email i password son obligatoris")
    if not nom:
        abort(400, description="El nom es obligatori")
    if role not in ("admin", "user"):
        abort(400, description="role ha de ser 'admin' o 'user'")
    if User.query.filter_by(email=email).first():
        abort(409, description=f"Ja existeix un usuari amb email '{email}'")

    u = User(email=email, nom=nom, role=role)
    u.set_password(password)
    db.session.add(u)
    db.session.commit()
    return jsonify(u.to_dict()), 201


@bp.route("/api/admin/users/<int:id>", methods=["PUT"])
@admin_required
def editar_user(id):
    u = db.get_or_404(User, id)
    data = request.get_json()

    if "email" in data:
        new_email = data["email"].strip().lower()
        existing = User.query.filter_by(email=new_email).first()
        if existing and existing.id != u.id:
            abort(409, description=f"Ja existeix un usuari amb email '{new_email}'")
        u.email = new_email
    if "nom" in data:
        u.nom = data["nom"].strip()
    if "role" in data:
        if data["role"] not in ("admin", "user"):
            abort(400, description="role ha de ser 'admin' o 'user'")
        u.role = data["role"]
    if "password" in data and data["password"].strip():
        u.set_password(data["password"].strip())

    db.session.commit()
    return jsonify(u.to_dict())


@bp.route("/api/admin/users/<int:id>", methods=["DELETE"])
@admin_required
def eliminar_user(id):
    u = db.get_or_404(User, id)
    if u.id == session.get("user_id"):
        abort(400, description="No pots eliminar el teu propi usuari")
    db.session.delete(u)
    db.session.commit()
    return jsonify({"ok": True})
