from datetime import date, datetime

from app import db


class AnalisiBlatT1(db.Model):
    __tablename__ = "analisi_blat_t1"

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # --- Identificació ---
    data = db.Column(db.Date, nullable=False)
    codi = db.Column(db.String(50), nullable=False)
    analista = db.Column(db.String(100))
    farina = db.Column(db.String(100))
    lot = db.Column(db.String(100))
    data_produccio = db.Column(db.Date)

    # --- Resultats farina ---
    rebuig_percentatge = db.Column(db.Float)
    rebuig_g = db.Column(db.Float)
    farina_w = db.Column(db.Float)
    farina_pl = db.Column(db.Float)
    farina_p = db.Column(db.Float)
    farina_l = db.Column(db.Float)
    farina_ie = db.Column(db.Float)
    farina_g = db.Column(db.Float)
    humitat = db.Column(db.Float)
    proteina = db.Column(db.Float)
    gindex = db.Column(db.Float)
    ghumit = db.Column(db.Float)
    gsec = db.Column(db.Float)
    pes_gluten_tamisat = db.Column(db.Float)
    pes_gluten_total = db.Column(db.Float)
    pes_gluten_sec = db.Column(db.Float)

    # --- Alveo 2h ---
    alveo2_w = db.Column(db.Float)
    alveo2_pl = db.Column(db.Float)
    alveo2_p = db.Column(db.Float)
    alveo2_l = db.Column(db.Float)
    alveo2_idp = db.Column(db.Float)
    alveo2_g = db.Column(db.Float)

    # --- NIR ---
    nir_cendres = db.Column(db.Float)
    nir_ghumit = db.Column(db.Float)
    nir_absorcio = db.Column(db.Float)

    # --- Especificacions ---
    espec_w = db.Column(db.Float)
    espec_pl = db.Column(db.Float)
    espec_proteina_min = db.Column(db.Float)
    espec_gluten_min = db.Column(db.Float)
    espec_p = db.Column(db.Float)
    espec_l = db.Column(db.Float)

    # --- Qualitat ---
    observacions = db.Column(db.Text)
    verificacio = db.Column(db.Boolean, default=False)
    persona_verificacio = db.Column(db.String(100))

    def to_dict(self):
        def _ser(v):
            if isinstance(v, (date, datetime)):
                return v.isoformat()
            return v

        return {
            c.name: _ser(getattr(self, c.name))
            for c in self.__table__.columns
        }
