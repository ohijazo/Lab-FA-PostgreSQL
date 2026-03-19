# Lab FA - LIMS Harinera

## Objectiu

Sistema LIMS (Laboratory Information Management System) per al laboratori d'una harinera. Permet registrar, consultar, editar i eliminar analisis de qualitat de diferents tipus de productes (blats, farines, bases, etc.).

El sistema es **totalment dinamic**: els tipus d'analisi, les seves seccions i els camps de cada seccio es gestionen des de la propia aplicacio (CRUD complet), sense tocar codi per afegir nous tipus.

## Stack

| Capa | Tecnologia | Versio |
|------|-----------|--------|
| Backend | Python + Flask + Flask-SQLAlchemy | Python 3.13, Flask 3.1 |
| Base de dades | SQLite | lab.db |
| Frontend | React + React Router + Vite | React 19, Router 7, Vite 8 |
| CSS | PicoCSS (CDN) + lab-fa.css custom | Pico v2 |
| CORS | Flask-CORS | 5.0.1 |

No hi ha autenticacio implementada.

## Arquitectura

```
frontend (localhost:5173)  -->  Vite proxy /api/*  -->  backend (localhost:5000)
     React SPA                                           Flask + SQLite
```

## Estructura de fitxers

```
lab-fa/
  backend/
    run.py                          # Punt d'entrada: python run.py
    seed.py                         # Script per poblar BD amb dades inicials
    migrate_to_multi.py             # Migracio de l'antic esquema (ja executat)
    requirements.txt                # Flask, Flask-SQLAlchemy, Flask-CORS
    app/
      __init__.py                   # App factory, registra blueprints
      config.py                     # Config SQLite path
      models.py                     # 4 models: TipusAnalisi, Seccio, Camp, Analisi
      routes/
        analisis.py                 # API publica: /api/tipus, /api/analisis/:slug
        admin.py                    # API admin: /api/admin/tipus, seccions, camps
  frontend/
    index.html                      # HTML shell amb PicoCSS CDN
    vite.config.js                  # Proxy /api -> localhost:5000
    package.json
    src/
      main.jsx                      # Entry point, importa lab-fa.css
      App.jsx                       # Routes: /, /admin/*, /:tipus/*
      api/
        analisis.js                 # Fetch per tipus/config/CRUD analisis
        admin.js                    # Fetch per CRUD tipus/seccions/camps
      assets/
        lab-fa.css                  # CSS custom sobre PicoCSS
      components/
        Layout.jsx                  # Nav sticky amb dropdowns per tipus + link Configuracio
        AnalisisForm.jsx            # Formulari generic conduit per seccions[].camps[]
        AnalisisList.jsx            # Taula amb columnes dinamiques
        AnalisisDetail.jsx          # Vista detall read-only
      pages/
        HomePage.jsx                # Dashboard amb targetes per cada tipus
        LlistaPage.jsx              # Llista paginada amb cerca
        NouAnalisiPage.jsx          # Crear nova analisi
        DetallPage.jsx              # Veure/eliminar analisi
        EditarAnalisiPage.jsx       # Editar analisi
        AdminTipusPage.jsx          # CRUD de tipus d'analisi
        AdminSeccionsPage.jsx       # CRUD de seccions d'un tipus
        AdminCampsPage.jsx          # CRUD de camps d'una seccio
```

## Model de dades

### Taules de configuracio (CRUD dinamic)

```sql
tipus_analisi
  id              INTEGER PK
  nom             VARCHAR(100) NOT NULL      -- "Blats T1", "Bases", etc.
  slug            VARCHAR(50) UNIQUE INDEX   -- "blats_t1", "bases"
  descripcio      VARCHAR(255)
  columnes_llista TEXT                       -- JSON array: ["data","codi","analista"]

seccio
  id              INTEGER PK
  tipus_id        FK -> tipus_analisi.id     -- CASCADE DELETE
  titol           VARCHAR(100) NOT NULL
  ordre           INTEGER

camp
  id              INTEGER PK
  seccio_id       FK -> seccio.id            -- CASCADE DELETE
  name            VARCHAR(100) NOT NULL      -- Nom intern: "min28_w"
  label           VARCHAR(100) NOT NULL      -- Etiqueta UI: "28 min W"
  type            VARCHAR(20) DEFAULT 'text' -- text, number, date, textarea, checkbox
  required        BOOLEAN DEFAULT FALSE
  ordre           INTEGER
```

### Taula de dades

```sql
analisi
  id              INTEGER PK
  tipus           VARCHAR(50) INDEX          -- Slug del tipus: "blats_t1"
  created_at      DATETIME
  updated_at      DATETIME
  dades           TEXT NOT NULL              -- JSON blob amb tots els valors
```

Les dades d'analisi es guarden com a JSON generic. Afegir un nou tipus no requereix canvi d'esquema.

## API

### Publica

| Metode | Ruta | Descripcio |
|--------|------|------------|
| GET | `/api/tipus` | Llistar tipus disponibles |
| GET | `/api/tipus/:slug/config` | Config completa (seccions + camps) |
| GET | `/api/analisis/:slug?page=&per_page=&q=` | Llistar paginat amb cerca |
| GET | `/api/analisis/:slug/:id` | Detall |
| POST | `/api/analisis/:slug` | Crear |
| PUT | `/api/analisis/:slug/:id` | Editar |
| DELETE | `/api/analisis/:slug/:id` | Eliminar |

### Admin

| Metode | Ruta | Descripcio |
|--------|------|------------|
| GET/POST | `/api/admin/tipus` | Llistar / Crear tipus |
| GET/PUT/DELETE | `/api/admin/tipus/:id` | Detall / Editar / Eliminar tipus |
| GET/POST | `/api/admin/tipus/:tipusId/seccions` | Llistar / Crear seccions |
| PUT/DELETE | `/api/admin/seccions/:id` | Editar / Eliminar seccio |
| GET/POST | `/api/admin/seccions/:seccioId/camps` | Llistar / Crear camps |
| PUT/DELETE | `/api/admin/camps/:id` | Editar / Eliminar camp |

## Rutes frontend

| Ruta | Pagina |
|------|--------|
| `/` | HomePage - dashboard amb targetes |
| `/admin` | AdminTipusPage - gestio tipus |
| `/admin/tipus/:tipusId/seccions` | AdminSeccionsPage |
| `/admin/seccions/:seccioId/camps` | AdminCampsPage |
| `/:tipus` | LlistaPage - llista paginada amb cerca |
| `/:tipus/nou` | NouAnalisiPage |
| `/:tipus/:id` | DetallPage |
| `/:tipus/:id/editar` | EditarAnalisiPage |

## Decisions tecniques

1. **Config dinamica a BD**: Tipus/seccions/camps a la BD, CRUD via admin. No fitxers de config.
2. **JSON blob**: `analisi.dades` es TEXT amb JSON. Flexibilitat total.
3. **Components generics**: Form, Detail, List reben config via props. Zero camps hardcodejats.
4. **Slug**: Identificador a URLs i a `analisi.tipus`. Auto-generat amb slugify.
5. **Cascade delete**: Eliminar tipus -> elimina seccions i camps. Analisis NO (lligades per slug, no FK).
6. **Cerca**: LIKE sobre JSON `dades`. Funcional, no optim per grans volums.

## Tipus d'analisi previstos

| Tipus | Estat |
|-------|-------|
| Blats T1 | Creat (10 seccions, 30 camps) |
| Blats | Pendent - crear des de /admin |
| Bases | Pendent |
| Dades fabrica | Pendent |
| Finals | Pendent |
| Farines MC | Pendent |
| Queixes | Pendent |
| Alienes | Pendent |
| Estudis | Pendent |
| Bipea | Pendent |
| Segonet fi | Pendent |

## Dades actuals BD

- 1 tipus: "Blats T1" (slug: `blats_t1`) amb 10 seccions i 30 camps
- 1 registre analisi actiu (id=3, tipus=`blats_t1`)
- 1 registre orfe (id=1, tipus=`blat_t1` - migracio antiga, no accessible)
- Taula backup: `analisi_blat_t1_backup`

## Proxims passos

### Funcionalitat
- [ ] Crear tipus restants des de /admin
- [ ] Ordenacio drag-and-drop per seccions/camps
- [ ] Exportacio Excel/CSV
- [ ] Importacio massiva des d'Excel
- [ ] Validacions avancades per camp (min/max, regex)

### Infraestructura
- [ ] Autenticacio i rols (admin vs operador)
- [ ] Neteja registre orfe i taula backup
- [ ] Deploy produccio

### UI/UX
- [ ] Selector de camps per columnes_llista (ara es text lliure)
- [ ] Breadcrumbs complets a admin
- [ ] Toast/notificacio despres de crear/editar
- [ ] Dashboard amb estadistiques

## Com executar

Backend (terminal 1):
```powershell
cd C:\Users\ohijazo.AGRIENERGIA\Projects\lab-fa\backend
venv\Scripts\activate
python run.py
```

Frontend (terminal 2):
```powershell
cd C:\Users\ohijazo.AGRIENERGIA\Projects\lab-fa\frontend
npm run dev
```

Seed (nomes si BD buida):
```powershell
cd C:\Users\ohijazo.AGRIENERGIA\Projects\lab-fa\backend
venv\Scripts\activate
python seed.py
```

## Preferencies de l'usuari

- Idioma de la UI i comunicacio: **catala**
- Entorn: **Windows 11, PowerShell** (no usar && per encadenar comandes)
- L'usuari gestiona els tipus d'analisi des de l'app, no vol fitxers de config
