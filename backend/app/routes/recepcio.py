import json
import time
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, Response, jsonify, request, session, stream_with_context
from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload
from app import db
from app.models import Analisi, TipusAnalisi, Seccio

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


def _rang_avui():
    ara = datetime.now()
    inici = datetime(ara.year, ara.month, ara.day)
    fi = inici + timedelta(days=1)
    return inici, fi


def _identif_per_tipus():
    """Mapa slug -> {'nom':..., 'identif':[{name,label,type}, ...]}"""
    tipus_list = TipusAnalisi.query.options(
        joinedload(TipusAnalisi.seccions).joinedload(Seccio.camps)
    ).all()
    result = {}
    for tp in tipus_list:
        identif = []
        for sec in tp.seccions:
            if sec.titol == "Identificació":
                identif = [
                    {"name": c.name, "label": c.label, "type": c.type}
                    for c in sec.camps if c.name != "codi"
                ]
                break
        result[tp.slug] = {"nom": tp.nom, "identif": identif}
    return result


def _build_snapshot(q):
    """Retorna la llista d'anàlisis d'avui, filtrada per q, per a la recepció."""
    inici, fi = _rang_avui()
    query = Analisi.query.filter(
        Analisi.created_at >= inici,
        Analisi.created_at < fi,
    )
    if q:
        q_lower = q.lower()
        query = query.filter(or_(
            func.lower(Analisi.dades["codi"].as_string()).contains(q_lower),
            func.lower(Analisi.dades["proveidor"].as_string()).contains(q_lower),
            func.lower(Analisi.dades["num_tiquet"].as_string()).contains(q_lower),
        ))
    analisis = query.order_by(Analisi.created_at.desc()).all()
    tipus_map = _identif_per_tipus()

    result = []
    for a in analisis:
        d = a.get_dades() or {}
        info = tipus_map.get(a.tipus, {"nom": a.tipus, "identif": []})
        identificacio = []
        for c in info["identif"]:
            v = d.get(c["name"])
            if v is None or v == "":
                continue
            identificacio.append({**c, "value": v})
        result.append({
            "id": a.id,
            "tipus_slug": a.tipus,
            "tipus_nom": info["nom"],
            "codi": d.get("codi") or "",
            "proveidor": d.get("proveidor") or "",
            "num_tiquet": d.get("num_tiquet") or "",
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "apte": a.apte,
            "identificacio": identificacio,
        })
    return result


def _get_signature_avui():
    """Retorna (count, max_updated_at) per detectar canvis a baix cost."""
    inici, fi = _rang_avui()
    row = db.session.query(
        func.count(Analisi.id),
        func.max(Analisi.updated_at)
    ).filter(
        Analisi.created_at >= inici,
        Analisi.created_at < fi,
    ).one()
    db.session.rollback()  # Allibera la transacció
    return (row[0], row[1].isoformat() if row[1] else None)


@bp.route("/api/recepcio/analisis", methods=["GET"])
@recepcio_or_admin_required
def llistar_avui():
    q = (request.args.get("q") or "").strip()
    return jsonify(_build_snapshot(q))


@bp.route("/api/recepcio/stream", methods=["GET"])
@recepcio_or_admin_required
def stream():
    """Server-Sent Events: envia snapshot inicial i actualitzacions quan canvien
    les anàlisis d'avui. Cada connexió bloqueja un worker gunicorn."""
    q = (request.args.get("q") or "").strip()

    def generate():
        # Snapshot inicial immediat
        try:
            snapshot = _build_snapshot(q)
            yield f"data: {json.dumps(snapshot, default=str)}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
            return

        try:
            last_sig = _get_signature_avui()
        except Exception:
            last_sig = None

        heartbeat_next = time.time() + 25
        POLL_INTERVAL = 2  # segons entre checks de la BD

        while True:
            time.sleep(POLL_INTERVAL)
            try:
                current_sig = _get_signature_avui()
                if current_sig != last_sig:
                    snapshot = _build_snapshot(q)
                    yield f"data: {json.dumps(snapshot, default=str)}\n\n"
                    last_sig = current_sig
                    heartbeat_next = time.time() + 25
                elif time.time() >= heartbeat_next:
                    # Heartbeat perquè Apache/proxies no tanquin la connexió
                    yield ": keepalive\n\n"
                    heartbeat_next = time.time() + 25
            except GeneratorExit:
                return
            except Exception as e:
                try:
                    db.session.rollback()
                except Exception:
                    pass
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
                # No sortir — reintentem en el proper cicle

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache, no-transform',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
        }
    )
