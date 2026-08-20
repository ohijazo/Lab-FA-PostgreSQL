"""Genera imatges mockup esquematiques per a la guia de formacio.

Crea representacions visuals de les pantalles noves (APTE, Recepcio,
selector de rol) per il.lustrar la Part II de la guia. No son captures
reals: son mockups dibuixats amb PIL en el mateix estil visual de l'app
(Pico + lab-fa.css).
"""

import os
from PIL import Image, ImageDraw, ImageFont

IMAGES_DIR = r"P:\lab-fa\images"

# Paleta Lab FA
BLAU = (30, 58, 95)          # #1E3A5F
BLAU_CLAR = (100, 116, 139)  # #64748B
BLAU_APTE = (37, 99, 235)    # #2563EB
VERMELL = (176, 0, 0)
VERMELL_CLAR = (254, 226, 226)  # fons NO APTE
GRIS = (200, 205, 215)
GRIS_TEXT = (75, 85, 105)
GRIS_FONS = (245, 247, 250)
VERD = (34, 197, 94)
GROC = (245, 158, 11)
BLANC = (255, 255, 255)


def load_font(size, bold=False):
    """Carrega una font sistema disponible a Windows."""
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, size)
            except Exception:
                continue
    return ImageFont.load_default()


def rounded_rect(draw, box, radius, fill=None, outline=None, width=1):
    """Dibuixa un rectangle amb cantonades arrodonides."""
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def badge(draw, x, y, text, kind="pendent", pad_x=12, pad_y=6, font=None):
    """Dibuixa un badge d'estat. Retorna (x2, y2) del cantell inferior dret."""
    if font is None:
        font = load_font(13, bold=True)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    w = tw + pad_x * 2
    h = th + pad_y * 2
    box = (x, y, x + w, y + h)
    if kind == "apte":
        fill, tc, ol = BLAU_APTE, BLANC, None
    elif kind == "no_apte":
        fill, tc, ol = VERMELL, BLANC, None
    elif kind == "finalitzat":
        fill, tc, ol = VERD, BLANC, None
    elif kind == "alerta":
        fill, tc, ol = GROC, BLANC, None
    else:  # pendent (outline)
        fill, tc, ol = BLANC, GRIS_TEXT, GRIS
    rounded_rect(draw, box, radius=14, fill=fill, outline=ol, width=2 if ol else 0)
    draw.text((x + pad_x, y + pad_y - 2), text, fill=tc, font=font)
    return x + w, y + h


# ---------------------------------------------------------------
# 1. Detall: capsalera amb 3 badges
# ---------------------------------------------------------------
def gen_apte_badges_detall():
    W, H = 1000, 260
    img = Image.new("RGB", (W, H), BLANC)
    d = ImageDraw.Draw(img)
    f_titol = load_font(26, bold=True)
    f_meta = load_font(14)

    # Barra superior (menu)
    d.rectangle((0, 0, W, 48), fill=BLAU)
    d.text((24, 14), "Lab FA", fill=BLANC, font=load_font(16, bold=True))
    d.text((120, 16), "Home  ·  Escaner  ·  Configuracio", fill=BLANC, font=load_font(13))

    # Titol + badges
    d.text((32, 78), "Blats T1 - BT1-2026-0234", fill=BLAU, font=f_titol)
    d.text((32, 118), "Creat 14/08/2026 · Analista: Maria Puig",
           fill=GRIS_TEXT, font=f_meta)

    x = 32
    x, _ = badge(d, x, 160, "Finalitzat", kind="finalitzat")
    x += 10
    x, _ = badge(d, x, 160, "Alerta", kind="pendent")
    x += 10
    x, _ = badge(d, x, 160, "APTE", kind="apte")

    # Fletxes / anotacio
    d.text((32, 210), "Els tres badges son clicables: canvien d'estat al cop.",
           fill=BLAU_CLAR, font=f_meta)

    out = os.path.join(IMAGES_DIR, "apte_badges_detall.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 2. Detall: bloc 'Valoracio' amb 3 botons grans
# ---------------------------------------------------------------
def gen_apte_bloc_valoracio():
    W, H = 1000, 340
    img = Image.new("RGB", (W, H), BLANC)
    d = ImageDraw.Draw(img)
    f_lbl = load_font(15, bold=True)
    f_titol = load_font(20, bold=True)
    f_desc = load_font(13)

    # Panel destacat
    rounded_rect(d, (32, 32, W - 32, H - 32), radius=12,
                 fill=GRIS_FONS, outline=GRIS, width=1)

    d.text((56, 56), "Valoracio", fill=BLAU, font=f_titol)
    d.text((56, 92), "Marca l'estat de l'analisi (podràs canviar-los des d'aqui o des dels badges).",
           fill=GRIS_TEXT, font=f_desc)

    # 3 botons grans
    btn_w, btn_h = 280, 100
    gap = 24
    y = 160
    x0 = 56

    def big_btn(x, y, label, kind):
        if kind == "finalitzat":
            fill, tc = VERD, BLANC
        elif kind == "alerta":
            fill, tc = GROC, BLANC
        elif kind == "apte":
            fill, tc = BLAU_APTE, BLANC
        else:
            fill, tc = BLANC, BLAU
        rounded_rect(d, (x, y, x + btn_w, y + btn_h), radius=10, fill=fill,
                     outline=None if fill != BLANC else GRIS, width=2)
        bbox = d.textbbox((0, 0), label, font=f_titol)
        tw = bbox[2] - bbox[0]
        d.text((x + (btn_w - tw) // 2, y + btn_h // 2 - 14), label, fill=tc, font=f_titol)

    big_btn(x0, y, "Finalitzat", "finalitzat")
    big_btn(x0 + (btn_w + gap), y, "Alerta", "alerta")
    big_btn(x0 + (btn_w + gap) * 2, y, "APTE", "apte")

    out = os.path.join(IMAGES_DIR, "apte_bloc_valoracio.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 3. Llistat amb columna d'estat APTE
# ---------------------------------------------------------------
def gen_apte_columna_llista():
    W, H = 1100, 380
    img = Image.new("RGB", (W, H), BLANC)
    d = ImageDraw.Draw(img)
    f_h = load_font(13, bold=True)
    f_c = load_font(13)

    d.text((32, 24), "Blats T1 - Llistat", fill=BLAU, font=load_font(20, bold=True))

    # Toolbar cerca
    rounded_rect(d, (32, 64, 320, 96), radius=6, outline=GRIS, width=1)
    d.text((44, 72), "Cercar...", fill=BLAU_CLAR, font=f_c)

    # Taula
    x0, y0 = 32, 116
    cols = [("APTE", 60), ("Data", 110), ("Codi", 180), ("Analista", 180),
            ("Bareja", 260), ("Humitat", 100), ("Proteina", 100)]
    # Header
    x = x0
    d.rectangle((x0, y0, x0 + sum(c[1] for c in cols), y0 + 32), fill=GRIS_FONS)
    for name, w in cols:
        d.text((x + 10, y0 + 8), name, fill=BLAU, font=f_h)
        x += w
    # Files
    rows = [
        ("apte",    "14/08/2026", "BT1-2026-0234", "Maria Puig",   "65% Nac + 35% Imp", "14.2", "11.8"),
        ("no_apte", "14/08/2026", "BT1-2026-0233", "Joan Bosch",   "100% Nacional",     "15.4", "10.2"),
        ("pendent", "13/08/2026", "BT1-2026-0232", "Anna Vilar",   "80% Nac + 20% Imp", "13.9", "12.1"),
        ("apte",    "13/08/2026", "BT1-2026-0231", "Maria Puig",   "100% Import",       "13.5", "11.5"),
        ("pendent", "12/08/2026", "BT1-2026-0230", "Joan Bosch",   "70% Nac + 30% Imp", "14.1", "11.7"),
    ]
    y = y0 + 32
    row_h = 40
    for r in rows:
        # Alternancia
        if (y - y0 - 32) // row_h % 2 == 1:
            d.rectangle((x0, y, x0 + sum(c[1] for c in cols), y + row_h), fill=(250, 251, 253))
        x = x0
        # Icona APTE
        state = r[0]
        cx = x + cols[0][1] // 2
        cy = y + row_h // 2
        if state == "apte":
            d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=BLAU_APTE)
            d.line([(cx - 5, cy), (cx - 1, cy + 4), (cx + 5, cy - 4)], fill=BLANC, width=2)
        elif state == "no_apte":
            d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=VERMELL)
            d.line([(cx - 5, cy - 5), (cx + 5, cy + 5)], fill=BLANC, width=2)
            d.line([(cx - 5, cy + 5), (cx + 5, cy - 5)], fill=BLANC, width=2)
        else:
            d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), outline=GRIS, width=1)
        x += cols[0][1]
        for i, val in enumerate(r[1:]):
            d.text((x + 10, y + 12), val, fill=GRIS_TEXT, font=f_c)
            x += cols[i + 1][1]
        # Linia
        d.line((x0, y + row_h, x0 + sum(c[1] for c in cols), y + row_h),
               fill=(230, 232, 238))
        y += row_h

    out = os.path.join(IMAGES_DIR, "apte_columna_llista.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 4. Selector de rol 'Recepcio'
# ---------------------------------------------------------------
def gen_rol_recepcio_selector():
    W, H = 700, 460
    img = Image.new("RGB", (W, H), BLANC)
    d = ImageDraw.Draw(img)
    f_h = load_font(18, bold=True)
    f_lbl = load_font(13, bold=True)
    f_i = load_font(13)

    d.text((32, 24), "Nou usuari", fill=BLAU, font=load_font(22, bold=True))

    def input_field(y, label, value):
        d.text((32, y), label, fill=BLAU, font=f_lbl)
        rounded_rect(d, (32, y + 22, W - 32, y + 62), radius=6, outline=GRIS, width=1)
        d.text((44, y + 32), value, fill=GRIS_TEXT, font=f_i)

    input_field(72,  "Correu",     "recepcio@harinera.cat")
    input_field(148, "Nom complet", "Joan Recepció")
    input_field(224, "Contrasenya", "•••••••••")

    # Selector de rol (obert)
    d.text((32, 300), "Rol", fill=BLAU, font=f_lbl)
    rounded_rect(d, (32, 322, W - 32, 362), radius=6, outline=BLAU_APTE, width=2)
    d.text((44, 332), "Recepció", fill=BLAU, font=f_i)
    # Fletxa
    d.polygon([(W - 56, 336), (W - 44, 336), (W - 50, 346)], fill=BLAU)

    # Dropdown obert amb opcions
    rounded_rect(d, (32, 368, W - 32, 448), radius=6, fill=BLANC, outline=GRIS, width=1)
    options = ["Editor", "Administrador", "Lectura", "Recepció"]
    oy = 372
    for opt in options:
        if opt == "Recepció":
            d.rectangle((32, oy, W - 32, oy + 20), fill=(219, 234, 254))
            d.text((44, oy + 3), opt + "   ← nova opcio", fill=BLAU, font=f_i)
        else:
            d.text((44, oy + 3), opt, fill=GRIS_TEXT, font=f_i)
        oy += 20

    out = os.path.join(IMAGES_DIR, "rol_recepcio_selector.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 5. Pantalla de Recepcio
# ---------------------------------------------------------------
def gen_recepcio_pantalla():
    W, H = 1200, 720
    img = Image.new("RGB", (W, H), GRIS_FONS)
    d = ImageDraw.Draw(img)
    f_h = load_font(24, bold=True)
    f_sub = load_font(13)
    f_c = load_font(13)
    f_b = load_font(13, bold=True)

    # Header
    d.rectangle((0, 0, W, 90), fill=BLANC)
    d.line((0, 90, W, 90), fill=GRIS, width=1)
    d.text((32, 22), "Recepció", fill=BLAU, font=f_h)
    # 'En directe' amb puntet verd
    d.ellipse((190, 34, 202, 46), fill=VERD)
    d.text((208, 33), "En directe", fill=VERD, font=f_b)
    # Boto activar avisos
    rounded_rect(d, (320, 26, 460, 60), radius=6, fill=BLANC, outline=BLAU_APTE, width=2)
    d.text((338, 34), "🔔 Avisos actius", fill=BLAU_APTE, font=f_b)
    # Cerca
    rounded_rect(d, (W - 380, 26, W - 32, 60), radius=6, outline=GRIS, width=1)
    d.text((W - 368, 34), "Cerca: codi, proveïdor, tiquet...", fill=BLAU_CLAR, font=f_c)

    # Tabs d'estat
    y = 110
    tabs = [("Tots", 12, "pendent"), ("Pendent", 3, "pendent"),
            ("APTE", 6, "apte"), ("NO APTE", 3, "no_apte")]
    x = 32
    for label, count, kind in tabs:
        text = f"{label}  {count}"
        bbox = d.textbbox((0, 0), text, font=f_b)
        tw = bbox[2] - bbox[0]
        w = tw + 32
        if kind == "apte":
            fill, tc = BLAU_APTE, BLANC
        elif kind == "no_apte":
            fill, tc = VERMELL, BLANC
        else:
            fill, tc = BLANC, GRIS_TEXT
        rounded_rect(d, (x, y, x + w, y + 40), radius=8, fill=fill,
                     outline=None if fill != BLANC else GRIS, width=1)
        d.text((x + 16, y + 12), text, fill=tc, font=f_b)
        x += w + 8

    # Filtres secundaris
    y2 = 165
    d.text((32, y2), "Tipus: Blats T1 ▾    ", fill=GRIS_TEXT, font=f_c)
    d.text((240, y2), "Rang: [ Tots ]  [ Últimes 4h ]  [ Última hora ]",
           fill=GRIS_TEXT, font=f_c)

    # Files d'analisis (compactes)
    y = 210
    rows = [
        ("apte",     "10:52", "BT1-0234", "Cooperativa Sud",   "T-1024", "Blats T1"),
        ("no_apte",  "10:41", "BT1-0233", "Cereals del Nord",  "T-1023", "Blats T1"),
        ("pendent",  "10:28", "BT1-0232", "Farines Fluvià",    "T-1022", "Blats T1"),
        ("apte",     "10:12", "BT1-0231", "Cooperativa Sud",   "T-1021", "Blats T1"),
        ("apte",     "09:58", "BT1-0230", "Cereals del Nord",  "T-1020", "Blats T1"),
        ("pendent",  "09:44", "BT1-0229", "Farines Fluvià",    "T-1019", "Blats T1"),
        ("apte",     "09:22", "BT1-0228", "Cooperativa Sud",   "T-1018", "Blats T1"),
        ("no_apte",  "09:03", "BT1-0227", "Cereals del Nord",  "T-1017", "Blats T1"),
    ]
    row_h = 56
    for state, hora, codi, prov, tiquet, tipus in rows:
        # Fila
        if state == "apte":
            border, fons = BLAU_APTE, BLANC
        elif state == "no_apte":
            border, fons = VERMELL, VERMELL_CLAR
        else:
            border, fons = GRIS, BLANC
        rounded_rect(d, (32, y, W - 32, y + row_h - 8), radius=6, fill=fons,
                     outline=GRIS, width=1)
        # Border left gruixut
        d.rectangle((32, y, 38, y + row_h - 8), fill=border)
        # Chevron
        d.polygon([(54, y + 20), (66, y + 20), (60, y + 30)], fill=GRIS_TEXT)
        # Contingut
        d.text((80, y + 8), codi, fill=BLAU, font=f_b)
        d.text((80, y + 28), prov, fill=GRIS_TEXT, font=f_c)
        d.text((400, y + 8), f"Tiquet {tiquet}", fill=BLAU, font=f_c)
        d.text((400, y + 28), tipus, fill=GRIS_TEXT, font=f_c)
        d.text((640, y + 16), hora, fill=GRIS_TEXT, font=f_b)
        # Badge estat (dreta)
        if state == "apte":
            badge(d, W - 160, y + 12, "✓ APTE", kind="apte")
        elif state == "no_apte":
            badge(d, W - 180, y + 12, "✗ NO APTE", kind="no_apte")
        else:
            badge(d, W - 160, y + 12, "Pendent", kind="pendent")
        y += row_h

    out = os.path.join(IMAGES_DIR, "recepcio_pantalla.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 6. Card "Rangs condicionals" a AdminSeccions (wizard 2 passos)
# ---------------------------------------------------------------
def gen_rangs_card_seccions():
    W, H = 1100, 460
    img = Image.new("RGB", (W, H), BLANC)
    d = ImageDraw.Draw(img)
    f_h = load_font(20, bold=True)
    f_b = load_font(14, bold=True)
    f_c = load_font(13)
    f_hint = load_font(12)

    d.text((32, 24), "Blats T1 — Seccions", fill=BLAU, font=f_h)

    # Card destacada
    card = (32, 72, W - 32, H - 32)
    rounded_rect(d, card, radius=12, fill=(247, 250, 255), outline=BLAU_APTE, width=2)

    # Header de la card (icona + títol + descripcio)
    d.rectangle((58, 92, 92, 126), fill=BLAU_APTE)
    d.text((66, 100), "⚙", fill=BLANC, font=f_h)
    d.text((108, 92), "Rangs condicionals per valor", fill=BLAU, font=f_b)
    d.text((108, 116), "Els camps numèrics poden tenir rangs vàlids diferents",
           fill=GRIS_TEXT, font=f_c)
    d.text((108, 132), "segons el valor d'un camp de tipus llista.",
           fill=GRIS_TEXT, font=f_c)

    # Pas 1 (actiu)
    y = 176
    # Cercle numerat
    d.ellipse((58, y, 92, y + 34), fill=BLAU_APTE)
    d.text((69, y + 6), "1", fill=BLANC, font=f_b)
    d.text((108, y - 2), "Selecciona el camp controlador", fill=BLAU, font=f_b)
    # Form
    rounded_rect(d, (108, y + 28, 460, y + 64), radius=6, outline=GRIS, width=1)
    d.text((120, y + 38), "tipus_blat (Identificació)  ▾", fill=BLAU, font=f_c)
    rounded_rect(d, (476, y + 28, 560, y + 64), radius=6, fill=BLAU_APTE)
    d.text((494, y + 38), "Desar", fill=BLANC, font=f_b)

    # Pas 2 (deshabilitat gris)
    y = 268
    d.ellipse((58, y, 92, y + 34), outline=GRIS, width=2)
    d.text((69, y + 6), "2", fill=GRIS, font=f_b)
    d.text((108, y - 2), "Configura els rangs per cada valor", fill=GRIS, font=f_b)
    d.text((108, y + 24), "Disponible un cop desat el controlador.",
           fill=GRIS, font=f_hint)

    # Progres visual
    y = 348
    d.text((58, y), "Estat: pas 1 actiu — cal seleccionar controlador i desar",
           fill=BLAU_CLAR, font=f_hint)
    # Barra progress
    rounded_rect(d, (58, y + 24, 458, y + 34), radius=5, fill=GRIS)
    rounded_rect(d, (58, y + 24, 158, y + 34), radius=5, fill=BLAU_APTE)

    out = os.path.join(IMAGES_DIR, "rangs_card_seccions.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 7. Wizard /admin/tipus/[id]/rangs (tabs + camps min/max)
# ---------------------------------------------------------------
def gen_rangs_wizard_valors():
    W, H = 1200, 720
    img = Image.new("RGB", (W, H), BLANC)
    d = ImageDraw.Draw(img)
    f_h = load_font(22, bold=True)
    f_sub = load_font(13)
    f_b = load_font(13, bold=True)
    f_c = load_font(13)
    f_hint = load_font(12)

    # Header
    d.text((32, 20), "Rangs — Blats T1", fill=BLAU, font=f_h)
    d.text((32, 54), "Selecciona un valor de «tipus_blat» i configura els rangs mín/màx.",
           fill=GRIS_TEXT, font=f_sub)
    d.text((32, 72), "Els canvis es desen automàticament.",
           fill=BLAU_CLAR, font=f_hint)
    # Botons capçalera dreta
    rounded_rect(d, (W - 380, 28, W - 210, 62), radius=6, outline=GRIS, width=1)
    d.text((W - 366, 36), "▦ Vista comparativa", fill=BLAU, font=f_b)
    rounded_rect(d, (W - 200, 28, W - 32, 62), radius=6, outline=GRIS, width=1)
    d.text((W - 186, 36), "⤓ Importar d'un altre tipus", fill=BLAU, font=f_b)

    # Tabs per valor del controlador
    y = 104
    tabs = [
        ("F1 - Gran Força", "8/8", "full"),
        ("F2 - Força",      "8/8", "full"),
        ("Panificable",     "3/8", "partial"),  # actiu
        ("Galleteres",      "0/8", "empty"),
        ("Durum",           "0/8", "empty"),
    ]
    x = 32
    for i, (label, cnt, kind) in enumerate(tabs):
        active = (kind == "partial")
        text = f"{label}   {cnt}"
        bbox = d.textbbox((0, 0), text, font=f_b)
        tw = bbox[2] - bbox[0]
        w = tw + 32
        if kind == "full":
            fill, tc, ol = VERD, BLANC, None
        elif active:
            fill, tc, ol = BLAU_APTE, BLANC, None
        else:
            fill, tc, ol = BLANC, GRIS_TEXT, GRIS
        rounded_rect(d, (x, y, x + w, y + 40), radius=8, fill=fill,
                     outline=ol, width=1 if ol else 0)
        d.text((x + 16, y + 12), text, fill=tc, font=f_b)
        x += w + 8

    # Toolbar del valor actiu
    y2 = 160
    rounded_rect(d, (32, y2, W - 32, y2 + 52), radius=8, fill=GRIS_FONS)
    d.text((48, y2 + 12), "Panificable", fill=BLAU, font=load_font(16, bold=True))
    d.text((48, y2 + 32), "3 de 8 camps configurats", fill=GRIS_TEXT, font=f_hint)
    # Botons dreta
    rounded_rect(d, (W - 440, y2 + 10, W - 300, y2 + 42), radius=6, outline=GRIS, width=1)
    d.text((W - 426, y2 + 18), "Copiar de… ▾", fill=BLAU, font=f_b)
    rounded_rect(d, (W - 290, y2 + 10, W - 170, y2 + 42), radius=6, outline=GRIS, width=1)
    d.text((W - 276, y2 + 18), "⧉ Aplicar a…", fill=BLAU, font=f_b)
    rounded_rect(d, (W - 160, y2 + 10, W - 48, y2 + 42), radius=6, outline=GRIS, width=1)
    d.text((W - 146, y2 + 18), "🗑  Netejar", fill=GRIS_TEXT, font=f_b)

    # Seccions amb camps min/max
    y = 232
    for seccio, camps in [
        ("Resultats farina",
            [("Humitat (%)",  "10.0", "15.0", True),
             ("Proteïna (%)", "10.5", "12.5", True),
             ("Gluten (%)",   "26.0", "32.0", True),
             ("W",            "",     "",     False)]),
        ("Resultats NIR",
            [("Cendres (%)",  "",     "",     False),
             ("Ghumit (%)",   "",     "",     False)]),
    ]:
        d.text((32, y), seccio, fill=BLAU, font=load_font(15, bold=True))
        y += 30
        # Capçalera
        d.text((32, y), "Camp", fill=GRIS_TEXT, font=f_b)
        d.text((520, y), "Mínim", fill=GRIS_TEXT, font=f_b)
        d.text((720, y), "Màxim", fill=GRIS_TEXT, font=f_b)
        y += 24
        for lbl, mn, mx, saving in camps:
            # Fons alternat
            d.rectangle((32, y, W - 32, y + 42), fill=(250, 251, 253))
            d.text((32, y + 12), lbl, fill=BLAU, font=f_c)
            # Input min
            fill_i = BLANC if not saving else (240, 253, 244)
            rounded_rect(d, (520, y + 6, 680, y + 38), radius=5,
                         fill=fill_i, outline=BLAU_APTE if saving else GRIS,
                         width=2 if saving else 1)
            d.text((532, y + 16), mn if mn else "—", fill=BLAU if mn else GRIS_TEXT, font=f_c)
            # Input max
            rounded_rect(d, (720, y + 6, 880, y + 38), radius=5,
                         fill=fill_i, outline=BLAU_APTE if saving else GRIS,
                         width=2 if saving else 1)
            d.text((732, y + 16), mx if mx else "—", fill=BLAU if mx else GRIS_TEXT, font=f_c)
            # Estat autosave
            if saving:
                d.ellipse((900, y + 15, 916, y + 31), fill=VERD)
                d.text((920, y + 15), "✓ desat", fill=VERD, font=f_hint)
            else:
                d.text((900, y + 15), "sense rang", fill=GRIS, font=f_hint)
            y += 44
        y += 12

    out = os.path.join(IMAGES_DIR, "rangs_wizard_valors.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 8. Dropdown "Copiar de..." obert
# ---------------------------------------------------------------
def gen_rangs_copiar_de():
    W, H = 900, 340
    img = Image.new("RGB", (W, H), BLANC)
    d = ImageDraw.Draw(img)
    f_b = load_font(14, bold=True)
    f_c = load_font(13)
    f_hint = load_font(12)

    # Toolbar simulat
    rounded_rect(d, (32, 32, W - 32, 84), radius=8, fill=GRIS_FONS)
    d.text((48, 44), "Panificable", fill=BLAU, font=load_font(16, bold=True))
    d.text((48, 64), "3 de 8 camps configurats", fill=GRIS_TEXT, font=f_hint)

    # Botó dropdown obert (destacat)
    rounded_rect(d, (W - 300, 42, W - 140, 74), radius=6, fill=BLANC,
                 outline=BLAU_APTE, width=2)
    d.text((W - 286, 50), "Copiar de… ▾", fill=BLAU, font=f_b)

    # Panell obert amb opcions
    rounded_rect(d, (W - 300, 80, W - 60, 280), radius=6, fill=BLANC,
                 outline=GRIS, width=1)
    opts = [
        ("F1 - Gran Força", "(8)"),
        ("F2 - Força",      "(8)"),
        ("Durum",           "(5)"),
    ]
    oy = 90
    d.text((W - 288, oy), "Copia els rangs des de:", fill=GRIS_TEXT, font=f_hint)
    oy += 24
    for i, (label, cnt) in enumerate(opts):
        if i == 0:
            d.rectangle((W - 300, oy - 4, W - 60, oy + 24), fill=(219, 234, 254))
            d.text((W - 288, oy), f"{label}  {cnt}", fill=BLAU, font=f_b)
        else:
            d.text((W - 288, oy), f"{label}  {cnt}", fill=BLAU, font=f_c)
        oy += 32

    # Anotacio
    d.text((32, 300),
           "Al triar un valor origen, els seus rangs es copien al valor actiu (Panificable).",
           fill=BLAU_CLAR, font=f_hint)

    out = os.path.join(IMAGES_DIR, "rangs_copiar_de.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 9. Modal "Aplicar a..." (bulk apply)
# ---------------------------------------------------------------
def gen_rangs_aplicar_a():
    W, H = 720, 540
    img = Image.new("RGB", (W, H), (0, 0, 0, 0))
    img = Image.new("RGB", (W, H), (30, 40, 60))  # backdrop fosc
    d = ImageDraw.Draw(img)
    f_h = load_font(18, bold=True)
    f_b = load_font(14, bold=True)
    f_c = load_font(13)
    f_hint = load_font(12)

    # Modal
    modal = (48, 48, W - 48, H - 48)
    rounded_rect(d, modal, radius=12, fill=BLANC)
    d.text((70, 68), "Aplicar rangs de F1 - Gran Força a diversos valors",
           fill=BLAU, font=f_h)
    d.line((70, 100, W - 70, 100), fill=GRIS, width=1)

    d.text((70, 116), "Selecciona els valors del controlador on vols copiar els rangs:",
           fill=GRIS_TEXT, font=f_c)

    # Botons de seleccio rapida
    rounded_rect(d, (70, 148, 220, 178), radius=6, outline=GRIS, width=1)
    d.text((80, 155), "Seleccionar tots", fill=BLAU, font=f_b)
    rounded_rect(d, (230, 148, 380, 178), radius=6, outline=GRIS, width=1)
    d.text((240, 155), "Desseleccionar", fill=BLAU, font=f_b)

    # Llista amb checkbox
    values = [
        ("F2 - Força",   True,  "ja té 8 rangs"),
        ("Panificable",  True,  "ja té 3 rangs"),
        ("Galleteres",   True,  "buit"),
        ("Durum",        False, "buit"),
    ]
    y = 200
    for label, checked, meta in values:
        # Checkbox
        if checked:
            rounded_rect(d, (70, y + 6, 90, y + 26), radius=4, fill=BLAU_APTE)
            d.line([(75, y + 16), (79, y + 20), (86, y + 12)], fill=BLANC, width=2)
        else:
            rounded_rect(d, (70, y + 6, 90, y + 26), radius=4,
                         fill=BLANC, outline=GRIS, width=1)
        d.text((104, y + 8), label, fill=BLAU, font=f_b)
        d.text((300, y + 8), meta, fill=GRIS_TEXT, font=f_hint)
        y += 40

    # Footer amb botons
    rounded_rect(d, (70, H - 108, 200, H - 76), radius=6, outline=GRIS, width=1)
    d.text((105, H - 100), "Cancel·lar", fill=BLAU, font=f_b)
    rounded_rect(d, (W - 300, H - 108, W - 70, H - 76), radius=6, fill=BLAU_APTE)
    d.text((W - 285, H - 100), "Aplicar a 3 valors", fill=BLANC, font=f_b)

    out = os.path.join(IMAGES_DIR, "rangs_aplicar_a.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 10. Modal Vista comparativa (matriu)
# ---------------------------------------------------------------
def gen_rangs_vista_comparativa():
    W, H = 1200, 560
    img = Image.new("RGB", (W, H), (30, 40, 60))
    d = ImageDraw.Draw(img)
    f_h = load_font(18, bold=True)
    f_b = load_font(13, bold=True)
    f_c = load_font(12)
    f_hint = load_font(11)

    modal = (32, 32, W - 32, H - 32)
    rounded_rect(d, modal, radius=12, fill=BLANC)

    d.text((56, 52), "Vista comparativa de tots els rangs", fill=BLAU, font=f_h)
    d.text((56, 82),
           "Matriu de només lectura amb tots els valors × camps. Verd = configurat, groc = usa estàtic, gris = sense rang.",
           fill=GRIS_TEXT, font=f_hint)

    # Llegenda
    x = 56
    for label, color in [("Configurat", VERD), ("Usa estàtic (fallback)", GROC), ("Sense rang", GRIS)]:
        rounded_rect(d, (x, 104, x + 14, 118), radius=3, fill=color)
        d.text((x + 22, 104), label, fill=BLAU, font=f_hint)
        x += 200

    # Taula
    header = ["Camp", "F1 - Gran Força", "F2 - Força", "Panificable", "Galleteres", "Durum"]
    rows = [
        ("Humitat (%)",  ["G","G","G","Y","-"]),
        ("Proteïna (%)", ["G","G","G","-","-"]),
        ("Gluten (%)",   ["G","G","G","-","-"]),
        ("W",            ["G","G","Y","-","-"]),
        ("P/L",          ["G","G","-","-","-"]),
        ("Cendres (%)",  ["G","G","-","-","-"]),
        ("Ghumit (%)",   ["G","G","-","-","-"]),
        ("Absorció (%)", ["G","Y","-","-","-"]),
    ]
    x0, y0 = 56, 148
    col_w = [180, 190, 190, 190, 175, 145]
    row_h = 40
    # Header
    x = x0
    d.rectangle((x0, y0, x0 + sum(col_w), y0 + row_h), fill=GRIS_FONS)
    for i, h in enumerate(header):
        d.text((x + 12, y0 + 12), h, fill=BLAU, font=f_b)
        x += col_w[i]
    # Rows
    y = y0 + row_h
    for lbl, cells in rows:
        d.text((x0 + 12, y + 12), lbl, fill=BLAU, font=f_c)
        x = x0 + col_w[0]
        for i, cell in enumerate(cells):
            if cell == "G":
                d.rectangle((x + 8, y + 6, x + col_w[i + 1] - 8, y + row_h - 6), fill=(220, 252, 231))
                d.text((x + 20, y + 12), "12.0 – 14.0", fill=(21, 128, 61), font=f_c)
            elif cell == "Y":
                d.rectangle((x + 8, y + 6, x + col_w[i + 1] - 8, y + row_h - 6), fill=(254, 249, 195))
                d.text((x + 20, y + 12), "12 – 14 (estàtic)", fill=(133, 77, 14), font=f_c)
            else:
                d.rectangle((x + 8, y + 6, x + col_w[i + 1] - 8, y + row_h - 6), fill=(241, 245, 249))
                d.text((x + 20, y + 12), "—", fill=GRIS, font=f_c)
            x += col_w[i + 1]
        d.line((x0, y + row_h, x0 + sum(col_w), y + row_h), fill=(230, 232, 238))
        y += row_h

    # Boto tancar
    rounded_rect(d, (W - 180, H - 76, W - 56, H - 44), radius=6, fill=BLAU_APTE)
    d.text((W - 130, H - 68), "Tancar", fill=BLANC, font=f_b)

    out = os.path.join(IMAGES_DIR, "rangs_vista_comparativa.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 11. Modal "Importar d'un altre tipus"
# ---------------------------------------------------------------
def gen_rangs_importar_tipus():
    W, H = 780, 560
    img = Image.new("RGB", (W, H), (30, 40, 60))
    d = ImageDraw.Draw(img)
    f_h = load_font(18, bold=True)
    f_b = load_font(14, bold=True)
    f_c = load_font(13)
    f_hint = load_font(12)

    modal = (48, 48, W - 48, H - 48)
    rounded_rect(d, modal, radius=12, fill=BLANC)
    d.text((70, 68), "Importar rangs d'un altre tipus", fill=BLAU, font=f_h)
    d.line((70, 100, W - 70, 100), fill=GRIS, width=1)

    d.text((70, 116), "Tipus origen:", fill=BLAU, font=f_b)
    rounded_rect(d, (70, 140, W - 70, 176), radius=6, outline=BLAU_APTE, width=2)
    d.text((84, 150), "Blats T2 (controlador: tipus_blat, 5 valors, 8 camps)   ▾",
           fill=BLAU, font=f_c)

    # Previsualitzacio
    d.text((70, 196), "Previsualització:", fill=BLAU, font=f_b)
    rounded_rect(d, (70, 220, W - 70, 400), radius=8, fill=GRIS_FONS)
    lines = [
        "✓  Camps coincidents (per name intern): 6 de 8",
        "     humitat, proteina, gluten, w, p_l, cendres",
        "",
        "✓  Valors del controlador comuns: 3 de 5",
        "     F1 - Gran Força, F2 - Força, Panificable",
        "",
        "⚠  Es filtraran els valors i camps que no existeixin al destí:",
        "     — Valors ignorats: Galleteres, Durum",
        "     — Camps ignorats: absorcio, ghumit",
        "",
        "Es copiaran 18 rangs (3 valors × 6 camps).",
    ]
    ly = 232
    for line in lines:
        color = BLAU if line.startswith("✓") else (GROC if line.startswith("⚠") else GRIS_TEXT)
        font = f_b if line.startswith(("✓", "⚠")) else f_c
        d.text((84, ly), line, fill=color, font=font)
        ly += 16

    # Warning
    d.text((70, 412), "⚠ L'importació sobreescriu els rangs existents als camps coincidents.",
           fill=VERMELL, font=f_hint)

    # Botons
    rounded_rect(d, (70, H - 108, 200, H - 76), radius=6, outline=GRIS, width=1)
    d.text((105, H - 100), "Cancel·lar", fill=BLAU, font=f_b)
    rounded_rect(d, (W - 200, H - 108, W - 70, H - 76), radius=6, fill=BLAU_APTE)
    d.text((W - 165, H - 100), "Importar", fill=BLANC, font=f_b)

    out = os.path.join(IMAGES_DIR, "rangs_importar_tipus.png")
    img.save(out)
    print(f"OK: {out}")


# ---------------------------------------------------------------
# 12. Formulari amb "Esperat: X-Y" sota els camps numerics
# ---------------------------------------------------------------
def gen_rangs_formulari_esperat():
    W, H = 900, 560
    img = Image.new("RGB", (W, H), BLANC)
    d = ImageDraw.Draw(img)
    f_h = load_font(20, bold=True)
    f_b = load_font(14, bold=True)
    f_c = load_font(13)
    f_hint = load_font(12)

    d.text((32, 24), "Nova anàlisi — Blats T1", fill=BLAU, font=f_h)

    # Controlador
    d.text((32, 76), "Tipus de blat *", fill=BLAU, font=f_b)
    rounded_rect(d, (32, 98, 400, 134), radius=6, outline=BLAU_APTE, width=2)
    d.text((46, 108), "F1 - Gran Força   ▾", fill=BLAU, font=f_c)
    d.text((32, 138), "Camp controlador — determina els rangs esperats a sota.",
           fill=BLAU_CLAR, font=f_hint)

    # Seccio: Resultats
    d.text((32, 176), "Resultats farina", fill=BLAU, font=f_b)
    d.line((32, 200, W - 32, 200), fill=GRIS, width=1)

    def field(x, y, label, value, hint, hint_color=GRIS_TEXT, input_error=False):
        d.text((x, y), label, fill=BLAU, font=f_b)
        border = VERMELL if input_error else GRIS
        w_input = 220
        rounded_rect(d, (x, y + 22, x + w_input, y + 58), radius=6,
                     outline=border, width=2 if input_error else 1)
        d.text((x + 12, y + 32), value, fill=BLAU, font=f_c)
        d.text((x, y + 64), hint, fill=hint_color, font=f_hint)

    y = 216
    field(32,  y, "Humitat (%)",  "13.2", "Esperat: 12 – 14", GRIS_TEXT)
    field(280, y, "Proteïna (%)", "10.5", "Esperat: 12 – 16  (fora del rang)",
          hint_color=VERMELL, input_error=True)
    field(560, y, "Gluten (%)",   "32.0", "Esperat: 30 – 35", GRIS_TEXT)

    y = 336
    field(32,  y, "W", "245", "Esperat: ≥ 200", GRIS_TEXT)
    field(280, y, "P/L", "0.6", "Esperat: ≤ 0.8", GRIS_TEXT)
    field(560, y, "Absorció (%)", "", "Requereix «Tipus de blat»", BLAU_CLAR)

    # Cas sense controlador
    y = 456
    d.text((32, y), "Notes:", fill=BLAU_CLAR, font=f_hint)
    d.text((32, y + 18), "• Sota cada camp numèric, el sistema mostra el rang esperat calculat en temps real.",
           fill=GRIS_TEXT, font=f_hint)
    d.text((32, y + 36), "• Si el valor introduït surt del rang, l'input es pinta d'alerta i el hint canvia de color.",
           fill=GRIS_TEXT, font=f_hint)
    d.text((32, y + 54), "• Els hints es refresquen automàticament quan es canvia el camp controlador.",
           fill=GRIS_TEXT, font=f_hint)

    out = os.path.join(IMAGES_DIR, "rangs_formulari_esperat.png")
    img.save(out)
    print(f"OK: {out}")


if __name__ == "__main__":
    if not os.path.isdir(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)
    gen_apte_badges_detall()
    gen_apte_bloc_valoracio()
    gen_apte_columna_llista()
    gen_rol_recepcio_selector()
    gen_recepcio_pantalla()
    gen_rangs_card_seccions()
    gen_rangs_wizard_valors()
    gen_rangs_copiar_de()
    gen_rangs_aplicar_a()
    gen_rangs_vista_comparativa()
    gen_rangs_importar_tipus()
    gen_rangs_formulari_esperat()
    print("Fet.")
