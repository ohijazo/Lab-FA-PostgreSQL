import os
from datetime import timedelta

# Arrel del repositori (config.py és a backend/app/)
_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

_MAX_ADJUNT_MB = int(os.environ.get("MAX_ADJUNT_MB", "25"))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-canvia-en-produccio")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    POWER_AUTOMATE_WEBHOOK_URL = os.environ.get("POWER_AUTOMATE_WEBHOOK_URL", "")
    ADMIN_KEY = os.environ.get("ADMIN_KEY", "")

    # --- Adjunts ---
    # A producció (Ubuntu) s'ha de posar UPLOAD_FOLDER=/var/lib/lab-fa/adjunts al .env:
    # fora de /var/www/lab-fa, així ni el git pull ni el canvi de dist el toquen mai.
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER") or os.path.join(_BASE, "backend", "uploads")
    MAX_ADJUNT_MB = _MAX_ADJUNT_MB
    # Marge sobre el límit per fitxer: hi cap el fitxer + la miniatura + el multipart
    MAX_CONTENT_LENGTH = (_MAX_ADJUNT_MB + 3) * 1024 * 1024
    MAX_EMAIL_ADJUNTS_MB = int(os.environ.get("MAX_EMAIL_ADJUNTS_MB", "8"))
    # Es deixa desactivat fins que el flux de Power Automate mapi els adjunts
    EMAIL_ADJUNTS_ENABLED = os.environ.get("EMAIL_ADJUNTS_ENABLED", "0") == "1"
