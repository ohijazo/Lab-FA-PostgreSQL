# Lab FA - Documentacio Tecnica Completa

## 1. Descripcio General

**Lab FA** es un sistema **LIMS** (Laboratory Information Management System) dissenyat per al laboratori de qualitat d'una harinera. Permet registrar, consultar, editar i eliminar analisis de qualitat de diferents tipus de productes (blats, farines, bases, etc.).

La caracteristica principal del sistema es que es **totalment dinamic**: els tipus d'analisi, les seves seccions i els camps de cada seccio es gestionen des de la propia aplicacio (panell d'administracio), sense necessitat de modificar codi per afegir nous tipus de productes o camps d'analisi.

---

## 2. Stack Tecnologic

### Backend

| Tecnologia | Versio | Funcio |
|-----------|--------|--------|
| **Python** | 3.13 | Llenguatge del servidor |
| **Flask** | 3.1.0 | Framework web (API REST) |
| **Flask-SQLAlchemy** | 3.1.1 | ORM per a la base de dades |
| **Flask-CORS** | 5.0.1 | Gestio de Cross-Origin requests |
| **python-dotenv** | 1.1.0 | Carrega variables d'entorn |
| **Werkzeug** | (via Flask) | Hash de contrasenyes (pbkdf2) |
| **SQLite** | integrat | Base de dades (fitxer `lab.db`) |

### Frontend

| Tecnologia | Versio | Funcio |
|-----------|--------|--------|
| **React** | 19.2.4 | Biblioteca UI (SPA) |
| **React Router DOM** | 7.13.1 | Enrutament client-side |
| **Vite** | 8.0.0 | Bundler i servidor de desenvolupament |
| **Chart.js** | 4.5.1 | Grafics i visualitzacio de dades |
| **react-chartjs-2** | 5.3.1 | Wrapper React per Chart.js |
| **PicoCSS** | v2 (CDN) | Framework CSS semantic (estils base) |
| **lab-fa.css** | custom | Estils personalitzats sobre PicoCSS |

---

## 3. Arquitectura

```
┌─────────────────────────┐         ┌─────────────────────────┐
│    Frontend (React)      │         │    Backend (Flask)       │
│    localhost:5173         │         │    localhost:5000         │
│                          │         │                          │
│  React SPA               │  /api/* │  API REST                │
│  Vite dev server    ─────┼────────>│  Flask + SQLAlchemy      │
│                          │  proxy  │         │                │
│  PicoCSS + lab-fa.css    │         │         v                │
│  Chart.js (dashboard)    │         │    ┌─────────┐           │
└─────────────────────────┘         │    │ SQLite  │           │
                                     │    │ lab.db  │           │
                                     │    └─────────┘           │
                                     └─────────────────────────┘
```

- El frontend es una **SPA** (Single Page Application) servida per Vite.
- Totes les crides API utilitzen rutes relatives (`/api/...`).
- Vite fa de **proxy invers**: redirigeix `/api/*` cap al backend Flask a `localhost:5000`.
- L'autenticacio utilitza **sessions de Flask** (cookie de sessio).
- CORS esta habilitat amb `supports_credentials=True`.

---

## 4. Estructura de Fitxers

```
lab-fa/
├── backend/
│   ├── run.py                          # Punt d'entrada del servidor
│   ├── seed.py                         # Script per poblar la BD amb dades inicials
│   ├── requirements.txt                # Dependencies Python
│   └── app/
│       ├── __init__.py                 # App factory, registra blueprints, migracions auto
│       ├── config.py                   # Configuracio (path SQLite)
│       ├── models.py                   # 5 models: User, TipusAnalisi, Seccio, Camp, Analisi
│       └── routes/
│           ├── analisis.py             # API publica: /api/tipus, /api/analisis/:slug
│           ├── admin.py                # API admin: CRUD tipus, seccions, camps, usuaris
│           ├── auth.py                 # API autenticacio: login, logout, me
│           └── dashboard.py            # API dashboard: KPIs, grafics, estadistiques
│
├── frontend/
│   ├── index.html                      # HTML shell amb PicoCSS CDN
│   ├── vite.config.js                  # Proxy /api -> localhost:5000
│   ├── package.json                    # Dependencies Node
│   └── src/
│       ├── main.jsx                    # Entry point React
│       ├── App.jsx                     # Definicio de rutes
│       ├── api/
│       │   ├── analisis.js             # Funcions fetch per analisis
│       │   ├── admin.js                # Funcions fetch per admin CRUD
│       │   ├── auth.js                 # Funcions fetch per autenticacio
│       │   └── dashboard.js            # Funcions fetch per dashboard
│       ├── assets/
│       │   └── lab-fa.css              # CSS personalitzat
│       ├── context/
│       │   └── AuthContext.jsx         # Context React per autenticacio
│       ├── components/
│       │   ├── Layout.jsx              # Navegacio sticky amb dropdowns
│       │   ├── AnalisisForm.jsx        # Formulari generic dinamic
│       │   ├── AnalisisList.jsx        # Taula amb columnes dinamiques
│       │   ├── AnalisisDetail.jsx      # Vista detall read-only
│       │   └── dashboard/
│       │       ├── KpiCards.jsx         # Targetes KPI
│       │       ├── GraficLinia.jsx      # Grafic de linies temporal
│       │       ├── GraficBarres.jsx     # Grafic de barres per grups
│       │       ├── GraficRendiment.jsx  # Grafic de rendiment
│       │       └── TaulaResum.jsx       # Taula resum estadistic
│       └── pages/
│           ├── HomePage.jsx            # Dashboard principal amb targetes
│           ├── LoginPage.jsx           # Pagina de login
│           ├── LlistaPage.jsx          # Llista paginada amb cerca
│           ├── NouAnalisiPage.jsx      # Crear nova analisi
│           ├── DetallPage.jsx          # Veure detall + imprimir + eliminar
│           ├── EditarAnalisiPage.jsx   # Editar analisi existent
│           ├── DashboardPage.jsx       # Dashboard amb grafics
│           ├── AdminTipusPage.jsx      # CRUD de tipus d'analisi
│           ├── AdminSeccionsPage.jsx   # CRUD de seccions
│           ├── AdminCampsPage.jsx      # CRUD de camps
│           └── AdminUsersPage.jsx      # Gestio d'usuaris
│
└── CLAUDE.md                           # Documentacio del projecte
```

---

## 5. Model de Dades

### 5.1 Diagrama Relacional

```
┌─────────────┐
│    User      │
├─────────────┤
│ id           │
│ email        │
│ nom          │
│ password_hash│
│ role         │
└─────────────┘

┌───────────────┐       ┌──────────────┐       ┌──────────────┐
│ TipusAnalisi  │ 1───N │   Seccio      │ 1───N │    Camp       │
├───────────────┤       ├──────────────┤       ├──────────────┤
│ id            │       │ id            │       │ id            │
│ nom           │       │ tipus_id (FK) │       │ seccio_id(FK) │
│ slug (UNIQUE) │       │ titol         │       │ name          │
│ descripcio    │       │ ordre         │       │ label         │
│ columnes_llista│      └──────────────┘       │ type          │
└───────────────┘                               │ required      │
                                                │ ordre         │
       ┌──────────────┐                         │ grup          │
       │   Analisi     │                         └──────────────┘
       ├──────────────┤
       │ id            │
       │ tipus (slug)  │  <-- Relacio logica per slug, NO FK
       │ created_at    │
       │ updated_at    │
       │ dades (JSON)  │  <-- Totes les dades en un blob JSON
       │ created_by    │
       │ updated_by    │
       └──────────────┘
```

### 5.2 Detall de Taules

#### `user` - Usuaris del sistema
| Camp | Tipus | Descripcio |
|------|-------|------------|
| id | INTEGER PK | Identificador unic |
| email | VARCHAR(120) UNIQUE | Correu electronic (login) |
| nom | VARCHAR(100) | Nom complet |
| password_hash | VARCHAR(256) | Hash pbkdf2 de la contrasenya |
| role | VARCHAR(20) | `admin` o `user` |

#### `tipus_analisi` - Definicio de tipus d'analisi
| Camp | Tipus | Descripcio |
|------|-------|------------|
| id | INTEGER PK | Identificador unic |
| nom | VARCHAR(100) | Nom visible: "Blats T1", "Bases" |
| slug | VARCHAR(50) UNIQUE | Identificador URL: "blats_t1", "bases" |
| descripcio | VARCHAR(255) | Descripcio opcional |
| columnes_llista | TEXT | JSON array amb els noms dels camps a mostrar a la llista |

#### `seccio` - Seccions dins d'un tipus
| Camp | Tipus | Descripcio |
|------|-------|------------|
| id | INTEGER PK | Identificador unic |
| tipus_id | FK -> tipus_analisi | Cascade delete |
| titol | VARCHAR(100) | Titol de la seccio: "Dades generals", "Farinografia" |
| ordre | INTEGER | Ordre de presentacio |

#### `camp` - Camps dins d'una seccio
| Camp | Tipus | Descripcio |
|------|-------|------------|
| id | INTEGER PK | Identificador unic |
| seccio_id | FK -> seccio | Cascade delete |
| name | VARCHAR(100) | Nom intern (clau JSON): "humitat_perc" |
| label | VARCHAR(100) | Etiqueta UI: "Humitat %" |
| type | VARCHAR(20) | Tipus d'input: text, number, date, textarea, checkbox |
| required | BOOLEAN | Si el camp es obligatori |
| ordre | INTEGER | Ordre de presentacio |
| grup | VARCHAR(100) | Sub-grup visual opcional dins la seccio |

#### `analisi` - Registres d'analisis
| Camp | Tipus | Descripcio |
|------|-------|------------|
| id | INTEGER PK | Identificador unic |
| tipus | VARCHAR(50) | Slug del tipus (relacio logica, no FK) |
| created_at | DATETIME | Data de creacio |
| updated_at | DATETIME | Data d'ultima modificacio |
| dades | TEXT | **JSON blob** amb tots els valors de l'analisi |
| created_by | VARCHAR(120) | Email de l'usuari que l'ha creat |
| updated_by | VARCHAR(120) | Email de l'ultim editor |

### 5.3 Decisio de Disseny: JSON Blob

Les dades de cada analisi es guarden com un unic camp JSON. Aixo proporciona:

- **Flexibilitat total**: afegir nous camps no requereix migracio de base de dades.
- **Independencia**: cada registre pot tenir camps diferents (registres antics no tenen els camps nous).
- **Simplicitat**: un sol camp TEXT per a totes les dades.
- **Limitacio**: la cerca es fa amb `LIKE` sobre el text JSON (funcional pero no optimitzat per grans volums).

---

## 6. API REST

### 6.1 Autenticacio

| Metode | Ruta | Descripcio |
|--------|------|------------|
| POST | `/api/auth/login` | Login amb email/password, crea sessio |
| GET | `/api/auth/me` | Retorna l'usuari actual de la sessio |
| POST | `/api/auth/logout` | Tanca la sessio |

### 6.2 API Publica (requereix login)

| Metode | Ruta | Descripcio |
|--------|------|------------|
| GET | `/api/tipus` | Llistar tots els tipus disponibles |
| GET | `/api/tipus/:slug/config` | Configuracio completa (seccions + camps) |
| GET | `/api/analisis/:slug` | Llistat paginat amb cerca i ordenacio |
| GET | `/api/analisis/:slug/:id` | Detall d'una analisi |
| POST | `/api/analisis/:slug` | Crear nova analisi |
| PUT | `/api/analisis/:slug/:id` | Editar analisi |
| DELETE | `/api/analisis/:slug/:id` | Eliminar analisi |

**Parametres de consulta per al llistat:**
- `page` - Pagina actual
- `per_page` - Registres per pagina (defecte: 25)
- `q` - Text de cerca (busca dins el JSON amb LIKE)
- `sort` - Camp per ordenar
- `sort_dir` - Direccio: `asc` o `desc`

### 6.3 API Admin (requereix rol admin)

**Tipus d'analisi:**
| Metode | Ruta | Descripcio |
|--------|------|------------|
| GET | `/api/admin/tipus` | Llistar tipus |
| POST | `/api/admin/tipus` | Crear tipus (slug auto-generat) |
| GET | `/api/admin/tipus/:id` | Detall amb config completa |
| PUT | `/api/admin/tipus/:id` | Editar tipus |
| DELETE | `/api/admin/tipus/:id` | Eliminar tipus (cascade seccions/camps) |

**Seccions:**
| Metode | Ruta | Descripcio |
|--------|------|------------|
| GET | `/api/admin/tipus/:tipusId/seccions` | Llistar seccions |
| POST | `/api/admin/tipus/:tipusId/seccions` | Crear seccio |
| PUT | `/api/admin/seccions/:id` | Editar seccio |
| DELETE | `/api/admin/seccions/:id` | Eliminar seccio |

**Camps:**
| Metode | Ruta | Descripcio |
|--------|------|------------|
| GET | `/api/admin/seccions/:seccioId/camps` | Llistar camps |
| POST | `/api/admin/seccions/:seccioId/camps` | Crear camp |
| PUT | `/api/admin/camps/:id` | Editar camp |
| DELETE | `/api/admin/camps/:id` | Eliminar camp |

**Usuaris:**
| Metode | Ruta | Descripcio |
|--------|------|------------|
| GET | `/api/admin/users` | Llistar usuaris |
| POST | `/api/admin/users` | Crear usuari |
| PUT | `/api/admin/users/:id` | Editar usuari |
| DELETE | `/api/admin/users/:id` | Eliminar usuari |

### 6.4 API Dashboard

| Metode | Ruta | Descripcio |
|--------|------|------------|
| GET | `/api/dashboard/:slug` | Estadistiques, KPIs, series temporals |

**Parametres:** `data_inici`, `data_fi`, `filtre`

Retorna: total registres, rang de dates, KPIs (avg/min/max/count per camp numeric), agrupacions, series temporals mensuals i opcions de filtre.

---

## 7. Rutes Frontend

| Ruta | Pagina | Acces |
|------|--------|-------|
| `/` | HomePage | Tots els usuaris |
| `/login` | LoginPage | Public |
| `/admin` | AdminTipusPage | Nomes admin |
| `/admin/tipus/:tipusId/seccions` | AdminSeccionsPage | Nomes admin |
| `/admin/seccions/:seccioId/camps` | AdminCampsPage | Nomes admin |
| `/admin/users` | AdminUsersPage | Nomes admin |
| `/dashboard/:tipus` | DashboardPage | Tots els usuaris |
| `/:tipus` | LlistaPage | Tots els usuaris |
| `/:tipus/nou` | NouAnalisiPage | Tots els usuaris |
| `/:tipus/:id` | DetallPage | Tots els usuaris |
| `/:tipus/:id/editar` | EditarAnalisiPage | Tots els usuaris |

---

## 8. Patrons de Disseny Clau

### 8.1 Configuracio Dinamica a BD

Tot l'esquema d'analisis es defineix a la base de dades, no al codi:

1. **TipusAnalisi** defineix el tipus (nom, slug, columnes de la llista).
2. **Seccio** agrupa camps relacionats amb un titol.
3. **Camp** defineix cada camp individual (clau, etiqueta, tipus d'input, obligatorietat, ordre, sub-grup).

**Afegir un nou tipus d'analisi requereix zero canvis al codi** - nomes interaccio amb el panell admin.

### 8.2 Components Generics

Tres components reben la configuracio (`seccions[]`) com a props i es renderitzen automaticament:

- **`AnalisisForm`** - Genera formularis amb fieldsets per seccio i inputs per camp. Suporta grids adaptatius (ample/estret), camps amples per etiquetes llargues, i sub-grups visuals.
- **`AnalisisDetail`** - Mateixa estructura que el formulari pero en mode lectura. Formata dates i booleans.
- **`AnalisisList`** - Taula amb nomes les columnes definides a `columnes_llista`. Ordenacio per columna.

### 8.3 Sistema de Sub-Grups

El camp `grup` a la taula `Camp` permet agrupar camps visualment dins d'una seccio. Camps consecutius amb el mateix valor de `grup` es mostren dins d'una caixa amb titol. Per exemple, dins la seccio "Farinografia" es poden tenir sub-grups com "W 28 min", "W 2h", etc.

### 8.4 Autenticacio i Rols

- **Sessions Flask** (cookie de sessio).
- L'`AuthContext` de React comprova la sessio al carregar (`GET /api/auth/me`).
- Si no hi ha sessio valida, es mostra `LoginPage`.
- Les rutes admin estan protegides per `AdminRoute` (redirigeix si `role !== 'admin'`).
- Usuari admin per defecte creat automaticament al primer inici: `admin@lab-fa.local` / `changeme`.

### 8.5 Slug Auto-Generat

Quan es crea un nou tipus d'analisi, el slug es genera automaticament:
- Es normalitzen accents (a->a, c->c, etc.)
- Es passa a minuscules
- Es substitueixen caracters no alfanumerics per guions baixos

### 8.6 Migracions Automatiques

Al iniciar l'aplicacio, `create_app()` executa migracions in-place via `PRAGMA table_info` + `ALTER TABLE`, sense necessitat d'un framework de migracions com Alembic.

---

## 9. CSS i Estils

### PicoCSS v2 (base)
- Carregat per CDN a `index.html`.
- Estils automatics per elements semantics HTML (`<table>`, `<button>`, `<input>`, `<article>`, etc.).
- Variables CSS reutilitzades (`--pico-background-color`, `--pico-muted-color`, etc.).

### lab-fa.css (personalitzat)
- `.nav-sticky` - Navegacio fixada a dalt.
- `.tipus-card` - Targetes amb ombra al hover.
- `.analisis-seccions` - Grid de 2 columnes per seccions.
- `.seccio-wide` - Seccions que ocupen tot l'ample (mes de 4 camps).
- `.camps-grid` / `.camps-grid-narrow` - Grids adaptatius per camps.
- `.form-subgrup` / `.detail-subgrup` - Caixes visuals per sub-grups.
- `.kpi-grid` / `.kpi-card` - Disseny de targetes KPI al dashboard.
- `@media print` - Estils d'impressio: A4 horitzontal, font 6.5pt, 3 columnes, oculta navegacio.

---

## 10. Dashboard i Estadistiques

El sistema inclou un modul de dashboard amb:

- **KPI Cards**: Mitjana, minim, maxim i recompte per a cada camp numeric.
- **Grafic de Linies**: Serie temporal mensual dels camps metric principals.
- **Grafic de Barres**: Comparativa de grups (per proveidor, farina, etc.).
- **Grafic de Rendiment**: Visualitzacio d'una metrica per grup.
- **Taula Resum**: Dades estadistiques en format taula.

El backend auto-detecta els camps numerics rellevants per patrons al nom (`_w`, `prot`, `humit`, `rendiment`, `cendres`) i els camps de text adequats per agrupar.

---

## 11. Funcionalitats Principals

| Funcionalitat | Descripcio |
|--------------|------------|
| CRUD Analisis | Crear, veure, editar i eliminar analisis de qualsevol tipus |
| Cerca | Cerca de text lliure sobre totes les dades JSON |
| Paginacio | Llistes paginades amb navegacio |
| Ordenacio | Columnes clicables per ordenar |
| Impressio | Pagina de detall optimitzada per A4 horitzontal |
| Admin Tipus | Crear/editar/eliminar tipus d'analisi |
| Admin Seccions | Gestionar seccions i seleccionar columnes de la llista |
| Admin Camps | Gestionar camps amb tipus d'input variables |
| Admin Usuaris | Crear/editar/eliminar usuaris amb rols |
| Dashboard | KPIs, grafics i estadistiques per tipus |
| Audit Trail | Registre de qui crea i modifica cada analisi |

---

## 12. Com Executar

### Backend
```powershell
cd C:\Users\ohijazo.AGRIENERGIA\Projects\lab-fa\backend
venv\Scripts\activate
python run.py
# Servidor a http://localhost:5000
```

### Frontend
```powershell
cd C:\Users\ohijazo.AGRIENERGIA\Projects\lab-fa\frontend
npm run dev
# Aplicacio a http://localhost:5173
```

### Seed (primera execucio)
```powershell
cd C:\Users\ohijazo.AGRIENERGIA\Projects\lab-fa\backend
venv\Scripts\activate
python seed.py
```

---

## 13. Dependencies

### Backend (`requirements.txt`)
```
Flask==3.1.0
Flask-SQLAlchemy==3.1.1
Flask-CORS==5.0.1
python-dotenv==1.1.0
```

### Frontend (`package.json`)
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.1.1",
  "chart.js": "^4.5.1",
  "react-chartjs-2": "^5.3.1"
}
```

---

*Document generat el 16 de marc de 2026.*
