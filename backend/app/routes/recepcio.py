from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, jsonify, request, session
from sqlalchemy import func
from app.models import Analisi, TipusAnalisi

bp = Blueprint("recepcio", __name__)


def recepcio_or_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "email" not in session:
            return jsonify({"error": "no autenticat"}), 401
        if session.get("role") not in ("recepcio", "admin"):
            return jsonify({"error": "forbidden"}), 403
        return f(*args, **kwargs)
    return decorated


@bp.route("/api/recepcio/analisis", methods=["GET"])
@recepcio_or_admin_required
def llistar_avui():
    q = (request.args.get("q") or "").strip()

    # Rang "avui" en TZ del servidor (Europe/Madrid al server Ubuntu)
    ara = datetime.now()
    inici = datetime(ara.year, ara.month, ara.day)
    fi = inici + timedelta(days=1)

    query = Analisi.query.filter(
        Analisi.created_at >= inici,
        Analisi.created_at < fi,
    )
    if q:
        query = query.filter(
            func.lower(Analisi.dades["codi"].as_string()).contains(q.lower())
        )

    analisis = query.order_by(Analisi.created_at.desc()).all()
    tipus_map = {t.slug: t.nom for t in TipusAnalisi.query.all()}

    result = []
    for a in analisis:
        d = a.get_dades() or {}
        result.append({
            "id": a.id,
            "tipus_slug": a.tipus,
            "tipus_nom": tipus_map.get(a.tipus, a.tipus),
            "codi": d.get("codi") or "",
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "apte": a.apte,
        })
    return jsonify(result)
