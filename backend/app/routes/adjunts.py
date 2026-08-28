"""Adjunts (imatges i vídeos) d'un anàlisi.

Els fitxers es desen al disc, no a la base de dades: UPLOAD_FOLDER/<analisi_id>/<uuid>.<ext>.
El nom del fitxer al disc mai ve del client — només l'extensió, i validada contra
una llista tancada. El nom original es guarda a la columna `nom` per mostrar-lo.
"""

import os
import uuid

from flask import Blueprint, jsonify, request, abort, session, send_file, current_app
from werkzeug.utils import secure_filename

from app import db
from app.models import Adjunt, Analisi
from app.i18n import t
from app.routes.analisis import login_required, write_required, _get_tipus_or_404

bp = Blueprint("adjunts", __name__)


# El guard per rol és per blueprint i no s'hereta: cal repetir-lo aquí.
@bp.before_request
def _block_recepcio_from_adjunts():
    if session.get("role") == "recepcio":
        return jsonify({"error": "forbidden"}), 403


# Llista tancada: extensió -> (mime, kind). Deliberadament sense SVG (un SVG
# servit inline és XSS) ni HEIC (els navegadors no el renderitzen).
FORMATS = {
    ".jpg": ("image/jpeg", "image"),
    ".jpeg": ("image/jpeg", "image"),
    ".png": ("image/png", "image"),
    ".webp": ("image/webp", "image"),
    ".gif": ("image/gif", "image"),
    ".mp4": ("video/mp4", "video"),
    ".webm": ("video/webm", "video"),
    ".mov": ("video/quicktime", "video"),
    ".3gp": ("video/3gpp", "video"),
}


def _root():
    return current_app.config["UPLOAD_FOLDER"]


def _dir_analisi(analisi_id):
    return os.path.join(_root(), str(analisi_id))


def _path(adjunt, thumb=False):
    """Ruta absoluta d'un adjunt, amb guarda contra sortir del directori d'uploads."""
    nom = adjunt.fitxer_thumb if thumb else adjunt.fitxer
    if not nom:
        return None
    full = os.path.realpath(os.path.join(_dir_analisi(adjunt.analisi_id), nom))
    arrel = os.path.realpath(_root())
    if not full.startswith(arrel + os.sep):
        return None
    return full


def _esborra_fitxers(paths):
    """Esborra fitxers tolerant que ja no hi siguin, i el directori si queda buit."""
    dirs = set()
    for p in paths:
        if not p:
            continue
        try:
            os.remove(p)
        except OSError:
            pass
        dirs.add(os.path.dirname(p))
    for d in dirs:
        try:
            os.rmdir(d)
        except OSError:
            pass  # encara hi ha fitxers: correcte


def _mida(fitxer):
    fitxer.seek(0, os.SEEK_END)
    mida = fitxer.tell()
    fitxer.seek(0)
    return mida


def _get_analisi(slug, id):
    _get_tipus_or_404(slug)
    a = db.get_or_404(Analisi, id)
    if a.tipus != slug:
        abort(404)
    return a


@bp.route("/api/analisis/<slug>/<int:id>/adjunts", methods=["GET"])
@login_required
def llistar_adjunts(slug, id):
    _get_analisi(slug, id)
    adjunts = Adjunt.query.filter_by(analisi_id=id).order_by(Adjunt.id).all()
    return jsonify([a.to_dict() for a in adjunts])


@bp.route("/api/analisis/<slug>/<int:id>/adjunts", methods=["POST"])
@write_required
def pujar_adjunt(slug, id):
    a = _get_analisi(slug, id)

    if "file" not in request.files:
        return jsonify({"error": t('no_fitxer')}), 400
    fitxer = request.files["file"]
    if not fitxer.filename:
        return jsonify({"error": t('no_fitxer')}), 400

    nom_original = secure_filename(fitxer.filename)[:255] or "adjunt"
    ext = os.path.splitext(nom_original)[1].lower()
    if ext not in FORMATS:
        return jsonify({"error": t('adjunt_format_no_permes')}), 400
    mime, kind = FORMATS[ext]

    max_mb = current_app.config["MAX_ADJUNT_MB"]
    mida = _mida(fitxer)
    if mida > max_mb * 1024 * 1024:
        return jsonify({"error": t('adjunt_massa_gran', mb=max_mb)}), 400

    carpeta = _dir_analisi(a.id)
    os.makedirs(carpeta, exist_ok=True)

    nom_disc = f"{uuid.uuid4().hex}{ext}"
    fitxer.save(os.path.join(carpeta, nom_disc))

    # Miniatura opcional: la genera el navegador, sempre JPEG
    nom_thumb = None
    thumb = request.files.get("thumb")
    if thumb and thumb.filename:
        nom_thumb = f"{uuid.uuid4().hex}_t.jpg"
        thumb.save(os.path.join(carpeta, nom_thumb))

    adjunt = Adjunt(
        analisi_id=a.id,
        tipus_slug=slug,
        nom=nom_original,
        fitxer=nom_disc,
        fitxer_thumb=nom_thumb,
        mime=mime,
        kind=kind,
        mida=mida,
        comentari=(request.form.get("comentari") or "").strip()[:300] or None,
        pujat_per=session.get("nom") or session.get("email") or "",
    )
    db.session.add(adjunt)
    db.session.commit()

    return jsonify(adjunt.to_dict()), 201


def _serveix(adjunt, thumb=False):
    ruta = _path(adjunt, thumb=thumb)
    if not ruta or not os.path.exists(ruta):
        abort(404)
    resp = send_file(
        ruta,
        mimetype="image/jpeg" if thumb else adjunt.mime,
        # conditional: sense això el <video> no pot avançar (peticions Range)
        conditional=True,
        download_name=adjunt.nom,
        as_attachment=False,
    )
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.cache_control.private = True   # està darrere de sessió
    resp.cache_control.max_age = 31536000  # el nom és un uuid: mai canvia
    return resp


@bp.route("/api/adjunts/<int:adjunt_id>/fitxer", methods=["GET"])
@login_required
def obtenir_fitxer(adjunt_id):
    return _serveix(db.get_or_404(Adjunt, adjunt_id))


@bp.route("/api/adjunts/<int:adjunt_id>/thumb", methods=["GET"])
@login_required
def obtenir_thumb(adjunt_id):
    return _serveix(db.get_or_404(Adjunt, adjunt_id), thumb=True)


@bp.route("/api/adjunts/<int:adjunt_id>", methods=["DELETE"])
@write_required
def eliminar_adjunt(adjunt_id):
    adjunt = db.get_or_404(Adjunt, adjunt_id)
    # Les rutes es llegeixen abans d'esborrar la fila, i el disc es neteja
    # després del commit: un fitxer orfe és inofensiu, una fila sense fitxer no.
    paths = [_path(adjunt), _path(adjunt, thumb=True)]
    db.session.delete(adjunt)
    db.session.commit()
    _esborra_fitxers(paths)
    return jsonify({"ok": True})
