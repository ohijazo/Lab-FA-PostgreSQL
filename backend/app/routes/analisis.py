from flask import Blueprint, jsonify, request

from app import db
from app.models import AnalisiBlatT1

bp = Blueprint("analisis", __name__)

DATE_FIELDS = {"data", "data_produccio"}
BOOL_FIELDS = {"verificacio"}


def _parse(data: dict) -> dict:
    """Convert incoming JSON values to proper Python types."""
    parsed = {}
    for key, val in data.items():
        if key in ("id", "created_at"):
            continue
        if key in DATE_FIELDS:
            from datetime import date as _date

            if val:
                parsed[key] = _date.fromisoformat(val)
            else:
                parsed[key] = None
        elif key in BOOL_FIELDS:
            parsed[key] = bool(val)
        elif val == "" or val is None:
            parsed[key] = None
        else:
            col = getattr(AnalisiBlatT1, key, None)
            if col is not None and hasattr(col, "type"):
                import sqlalchemy

                if isinstance(col.type, sqlalchemy.Float):
                    parsed[key] = float(val)
                else:
                    parsed[key] = val
            else:
                parsed[key] = val
    return parsed


@bp.route("/api/analisis", methods=["GET"])
def llistar():
    analisis = AnalisiBlatT1.query.order_by(AnalisiBlatT1.data.desc()).all()
    return jsonify([a.to_dict() for a in analisis])


@bp.route("/api/analisis/<int:id>", methods=["GET"])
def detall(id):
    a = db.get_or_404(AnalisiBlatT1, id)
    return jsonify(a.to_dict())


@bp.route("/api/analisis", methods=["POST"])
def crear():
    data = _parse(request.get_json())
    a = AnalisiBlatT1(**data)
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict()), 201


@bp.route("/api/analisis/<int:id>", methods=["PUT"])
def editar(id):
    a = db.get_or_404(AnalisiBlatT1, id)
    data = _parse(request.get_json())
    for key, val in data.items():
        setattr(a, key, val)
    db.session.commit()
    return jsonify(a.to_dict())


@bp.route("/api/analisis/<int:id>", methods=["DELETE"])
def eliminar(id):
    a = db.get_or_404(AnalisiBlatT1, id)
    db.session.delete(a)
    db.session.commit()
    return jsonify({"ok": True})
