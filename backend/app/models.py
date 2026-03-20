from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import JSONB
from app import db


# --------------- User model ---------------

class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    nom = db.Column(db.String(100), nullable=False, default="")
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "nom": self.nom,
            "role": self.role,
        }


# --------------- Config models (CRUD-manageable) ---------------

class TipusAnalisi(db.Model):
    __tablename__ = "tipus_analisi"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(50), nullable=False, unique=True, index=True)
    descripcio = db.Column(db.String(255), default="")
    columnes_llista = db.Column(JSONB, default=list)

    seccions = db.relationship("Seccio", backref="tipus", cascade="all, delete-orphan",
                               order_by="Seccio.ordre")

    def get_columnes_llista(self):
        return self.columnes_llista or []

    def set_columnes_llista(self, cols):
        self.columnes_llista = cols

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "slug": self.slug,
            "descripcio": self.descripcio,
            "columnes_llista": self.get_columnes_llista(),
        }

    def to_config(self):
        """Full config dict compatible with frontend expectations."""
        return {
            "id": self.id,
            "nom": self.nom,
            "slug": self.slug,
            "descripcio": self.descripcio,
            "columnes_llista": self.get_columnes_llista(),
            "seccions": [s.to_dict() for s in self.seccions],
        }


class Seccio(db.Model):
    __tablename__ = "seccio"

    id = db.Column(db.Integer, primary_key=True)
    tipus_id = db.Column(db.Integer, db.ForeignKey("tipus_analisi.id"), nullable=False)
    titol = db.Column(db.String(100), nullable=False)
    ordre = db.Column(db.Integer, default=0)

    camps = db.relationship("Camp", backref="seccio", cascade="all, delete-orphan",
                            order_by="Camp.ordre")

    def to_dict(self):
        return {
            "id": self.id,
            "titol": self.titol,
            "ordre": self.ordre,
            "camps": [c.to_dict() for c in self.camps],
        }


class Camp(db.Model):
    __tablename__ = "camp"

    id = db.Column(db.Integer, primary_key=True)
    seccio_id = db.Column(db.Integer, db.ForeignKey("seccio.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    label = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False, default="text")
    required = db.Column(db.Boolean, default=False)
    ordre = db.Column(db.Integer, default=0)
    grup = db.Column(db.String(100), default="")
    opcions = db.Column(JSONB, default=list)
    alerta_min = db.Column(db.Float, nullable=True)
    alerta_max = db.Column(db.Float, nullable=True)
    alerta_color_min = db.Column(db.String(20), nullable=True)
    alerta_color_max = db.Column(db.String(20), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "label": self.label,
            "type": self.type,
            "required": self.required,
            "ordre": self.ordre,
            "grup": self.grup or "",
            "opcions": self.opcions or [],
            "alerta_min": self.alerta_min,
            "alerta_max": self.alerta_max,
            "alerta_color_min": self.alerta_color_min,
            "alerta_color_max": self.alerta_color_max,
        }


# --------------- Data model ---------------

class Analisi(db.Model):
    __tablename__ = "analisi"

    id = db.Column(db.Integer, primary_key=True)
    tipus = db.Column(db.String(50), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    dades = db.Column(JSONB, nullable=False, default=dict)
    created_by = db.Column(db.String(120))
    updated_by = db.Column(db.String(120))

    def get_dades(self):
        return self.dades or {}

    def set_dades(self, data):
        self.dades = data

    def to_dict(self):
        d = self.get_dades()
        d["id"] = self.id
        d["tipus"] = self.tipus
        d["created_at"] = self.created_at.isoformat() if self.created_at else None
        d["updated_at"] = self.updated_at.isoformat() if self.updated_at else None
        d["created_by"] = self.created_by
        d["updated_by"] = self.updated_by
        return d


# --------------- Edit lock (presence) ---------------

class EditLock(db.Model):
    __tablename__ = "edit_lock"

    id = db.Column(db.Integer, primary_key=True)
    analisi_id = db.Column(db.Integer, db.ForeignKey("analisi.id", ondelete="CASCADE"), nullable=False, index=True)
    user_email = db.Column(db.String(120), nullable=False)
    locked_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    EXPIRY_MINUTES = 5

    def is_expired(self):
        return (datetime.utcnow() - self.locked_at).total_seconds() > self.EXPIRY_MINUTES * 60

    def to_dict(self):
        return {
            "analisi_id": self.analisi_id,
            "user_email": self.user_email,
            "locked_at": self.locked_at.isoformat() if self.locked_at else None,
        }
