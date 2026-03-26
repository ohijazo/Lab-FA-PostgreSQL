from flask import Blueprint, jsonify, request, session
from app import db
from app.models import User
from app.i18n import t

bp = Blueprint("auth", __name__)


@bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": t('credencials_incorrectes')}), 401

    session["user_id"] = user.id
    session["email"] = user.email
    session["nom"] = user.nom
    session["role"] = user.role
    return jsonify(user.to_dict())


@bp.route("/api/auth/me", methods=["GET"])
def me():
    if "email" not in session:
        return jsonify({"error": t('no_autenticat')}), 401
    return jsonify({
        "id": session["user_id"],
        "email": session["email"],
        "nom": session["nom"],
        "role": session["role"],
    })


@bp.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})
