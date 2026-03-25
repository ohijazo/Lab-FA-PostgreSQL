# Lab FA - LIMS Farinera

## Objectiu

Sistema LIMS (Laboratory Information Management System) per al laboratori d'una farinera.

Permet registrar, consultar, editar i eliminar anàlisis de qualitat de diferents tipus de productes (blats, farines, bases, etc.).

El sistema és **totalment dinàmic**: els tipus d'anàlisi, les seves seccions i els camps de cada secció es gestionen des de la pròpia aplicació (CRUD complet), sense tocar codi per afegir nous tipus.

L'objectiu actual del projecte és deixar-lo preparat per funcionar en un **servidor Ubuntu** perquè hi pugui treballar **tota l'empresa** via xarxa o entorn corporatiu.

---

## Context actual del projecte

El projecte va començar com una aplicació local senzilla, però ara està en procés d'evolució cap a una aplicació multiusuari desplegada en servidor.

Això implica que qualsevol canvi ha de tenir en compte:

* entorn de producció Linux / Ubuntu
* ús concurrent per diversos usuaris
* persistència robusta de dades
* configuració de desplegament
* estabilitat i mantenibilitat

⚠️ Hi ha autenticació implementada (login obligatori per accedir a l'aplicació).

Actualment:
- existeix sistema de login
- no hi ha rols avançats (admin vs operador complet)
- la gestió d'usuaris és bàsica

👉 Qualsevol canvi ha de respectar el sistema d'autenticació existent i no eliminar-lo ni simplificar-lo.

---

## Stack

| Capa          | Tecnologia                        | Versió                     |
| ------------- | --------------------------------- | -------------------------- |
| Backend       | Python + Flask + Flask-SQLAlchemy | Python 3.13, Flask 3.1     |
| Base de dades | PostgreSQL                        | entorn servidor            |
| Frontend      | React + React Router + Vite       | React 19, Router 7, Vite 8 |
| CSS           | PicoCSS (CDN) + lab-fa.css custom | Pico v2                    |
| CORS          | Flask-CORS                        | 5.0.1                      |

---

## Arquitectura

### Desenvolupament actual

```
frontend (localhost:5173)
    ↓ (Vite proxy /api/*)
backend (localhost:5000)
    ↓
PostgreSQL
```

### Objectiu de desplegament

```
Usuaris empresa
    ↓
Servidor Ubuntu
    ↓
Frontend React compilat / servit en producció
    ↓
Backend Flask
    ↓
PostgreSQL
```

El projecte ja no s'ha de pensar com una app purament local, sinó com una aplicació interna corporativa desplegada en servidor.

---

## Principi clau del sistema

👉 **Tot és dinàmic i definit a base de dades**

* NO existeixen formularis hardcodejats per cada tipus
* NO s'han de crear nous tipus tocant codi
* TOT passa per:

  * tipus
  * seccions
  * camps

Qualsevol canvi ha de respectar aquest model.

---

## Estructura de fitxers

```
lab-fa/
  backend/
    run.py
    seed.py
    migrate_to_multi.py
    requirements.txt
    app/
      __init__.py
      config.py
      models.py
      routes/
        analisis.py
        admin.py

  frontend/
    index.html
    vite.config.js
    package.json
    src/
      main.jsx
      App.jsx
      api/
        analisis.js
        admin.js
      assets/
        lab-fa.css
      components/
        Layout.jsx
        AnalisisForm.jsx
        AnalisisList.jsx
        AnalisisDetail.jsx
      pages/
        HomePage.jsx
        LlistaPage.jsx
        NouAnalisiPage.jsx
        DetallPage.jsx
        EditarAnalisiPage.jsx
        AdminTipusPage.jsx
        AdminSeccionsPage.jsx
        AdminCampsPage.jsx
```

---

## Model de dades

### Taules de configuració dinàmica

```sql
tipus_analisi
  id                SERIAL / INTEGER PK
  nom               VARCHAR(100) NOT NULL
  slug              VARCHAR(50) UNIQUE INDEX
  descripcio        VARCHAR(255)
  columnes_llista   TEXT o JSON
```

```sql
seccio
  id                SERIAL / INTEGER PK
  tipus_id          FK -> tipus_analisi.id
  titol             VARCHAR(100) NOT NULL
  ordre             INTEGER
```

```sql
camp
  id                SERIAL / INTEGER PK
  seccio_id         FK -> seccio.id
  name              VARCHAR(100) NOT NULL
  label             VARCHAR(100) NOT NULL
  type              VARCHAR(20) DEFAULT 'text'
  required          BOOLEAN DEFAULT FALSE
  ordre             INTEGER
```

### Taula de dades

```sql
analisi
  id                SERIAL / INTEGER PK
  tipus             VARCHAR(50) INDEX
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
  dades             TEXT o JSON
```

Les dades d'anàlisi es guarden de forma genèrica. Afegir un nou tipus no hauria de requerir canvi d'esquema.

⚠️ Encara que es faci servir PostgreSQL, s'ha de preservar la flexibilitat del model dinàmic.

---

## API

### Pública

| Mètode | Ruta                                     | Descripció                |
| ------ | ---------------------------------------- | ------------------------- |
| GET    | `/api/tipus`                             | Llistar tipus disponibles |
| GET    | `/api/tipus/:slug/config`                | Config completa del tipus |
| GET    | `/api/analisis/:slug?page=&per_page=&q=` | Llistar paginat amb cerca |
| GET    | `/api/analisis/:slug/:id`                | Detall                    |
| POST   | `/api/analisis/:slug`                    | Crear                     |
| PUT    | `/api/analisis/:slug/:id`                | Editar                    |
| DELETE | `/api/analisis/:slug/:id`                | Eliminar                  |

### Admin

| Mètode         | Ruta                                  | Descripció                       |
| -------------- | ------------------------------------- | -------------------------------- |
| GET/POST       | `/api/admin/tipus`                    | Llistar / Crear tipus            |
| GET/PUT/DELETE | `/api/admin/tipus/:id`                | Detall / Editar / Eliminar tipus |
| GET/POST       | `/api/admin/tipus/:tipusId/seccions`  | Llistar / Crear seccions         |
| PUT/DELETE     | `/api/admin/seccions/:id`             | Editar / Eliminar secció         |
| GET/POST       | `/api/admin/seccions/:seccioId/camps` | Llistar / Crear camps            |
| PUT/DELETE     | `/api/admin/camps/:id`                | Editar / Eliminar camp           |

---

## Rutes frontend

| Ruta                              | Pàgina            |
| --------------------------------- | ----------------- |
| `/`                               | HomePage          |
| `/admin`                          | AdminTipusPage    |
| `/admin/tipus/:tipusId/seccions`  | AdminSeccionsPage |
| `/admin/seccions/:seccioId/camps` | AdminCampsPage    |
| `/:tipus`                         | LlistaPage        |
| `/:tipus/nou`                     | NouAnalisiPage    |
| `/:tipus/:id`                     | DetallPage        |
| `/:tipus/:id/editar`              | EditarAnalisiPage |

---

## Decisions tècniques clau

1. Configuració dinàmica a BD
2. Model flexible de dades
3. Components genèrics
4. Slug com a identificador
5. Preparació per entorn multiusuari
6. Compatibilitat backend/frontend

---

## Estat actual

* Migració a PostgreSQL en curs / completada
* Preparació per desplegament en Ubuntu
* Sistema funcional en desenvolupament
* Sense autenticació encara

---

## Prioritats actuals

### Infraestructura

* [ ] Stabilitzar PostgreSQL
* [ ] Preparar deploy Ubuntu
* [ ] Config producció
* [ ] Servei backend
* [ ] Build frontend
* [ ] Variables d'entorn

### Funcionalitat

* [ ] Crear tipus restants
* [ ] Exportació Excel/CSV
* [ ] Importació massiva
* [ ] Validacions avançades
* [ ] Drag & drop

### Seguretat

* [ ] Autenticació
* [ ] Rols
* [ ] Control accés

---

## Execució en desenvolupament

### Backend

```powershell
cd backend
venv\Scripts\activate
python run.py
```

### Frontend

```powershell
cd frontend
npm run dev
```

---

## Entorns

### Local

* Windows 11
* PowerShell
* PostgreSQL

### Producció

* Ubuntu Server
* Flask
* PostgreSQL
* Accés empresa

---

## Preferències

* Idioma: català
* Windows + PowerShell
* Deploy Ubuntu

⚠️ No usar `&&`

---

# NORMES PER CLAUDE CODE

## Abans de fer canvis

* Analitza codi existent
* Explica pla si és complex
* Fes canvis mínims
* No refactoritzar innecessàriament

---

## Regla principal

👉 NO TRENCAR EL MODEL DINÀMIC

---

## Backend

* Respectar Flask actual
* No dependències noves
* Evitar migracions

---

## Base de dades

* PostgreSQL obligatori
* No assumir SQLite
* Pensar en producció

---

## Frontend

* Components genèrics
* No hardcodejar
* UI català

---

## API

* No trencar contractes
* Compatibilitat frontend

---

## Producció

* Pensar en Ubuntu
* Multiusuari
* Variables entorn

---

## Estil de treball

Sempre indicar:

1. Fitxers
2. Canvis
3. Impacte
4. Riscos

---

## Flux obligatori de treball

Quan es demani qualsevol canvi:

1. NO escriure codi directament
2. Primer fer:
   - resum del problema
   - pla curt (passos)
   - fitxers afectats
   - riscos

3. Esperar confirmació si el canvi és gran. Es considera canvi gran si afecta:
   - models
   - base de dades
   - API
   - autenticació
   - desplegament
   - més de 3 fitxers

4. Implementar només després

5. Després d'implementar:
   - resum dels canvis
   - impacte
   - possibles problemes

   També ha de confirmar:
   - si manté compatibilitat amb PostgreSQL
   - si manté el model dinàmic
   - si requereix migració
   - si afecta el desplegament a Ubuntu

⚠️ Si no es segueix aquest flux, la resposta no és vàlida

---

## Anti-errors crítics

Claude ha d'evitar explícitament:

- Introduir lògica específica per un tipus (ex: if tipus == "blats")
- Convertir el sistema dinàmic en estructures fixes
- Afegir dependències innecessàries
- Escriure codi pensat per SQLite
- Fer queries incompatibles amb PostgreSQL
- Canviar noms de camps o estructures JSON existents

---

## Mode revisió

Claude ha d'actuar també com a revisor de codi:

Per qualsevol canvi ha de validar:

- arquitectura dinàmica intacta
- compatibilitat PostgreSQL
- compatibilitat frontend
- impacte en producció (Ubuntu)
- simplicitat de la solució

Si detecta problemes, ha de dir-ho encara que no s'hagi demanat explícitament.

---

## Regla de mínima intervenció

Sempre prioritzar:

1. reutilitzar codi existent
2. modificar el mínim possible
3. evitar crear nous patrons si ja existeixen

❌ No crear noves estructures si ja hi ha una forma establerta

---

## Quan hi ha dubtes

Si falta informació:

- no inventar
- fer la mínima assumpció possible
- indicar què falta

---

## Dependències

- No afegir noves llibreries sense justificació clara
- Si es proposa una nova dependència:
  - explicar per què és necessària
  - indicar alternatives sense dependència
  - indicar impacte en producció

---

## Anti-sobreenginyeria

Evitar:

- solucions excessivament complexes
- abstractions innecessàries
- introduir patrons nous sense necessitat clara
- optimitzacions prematures

👉 Preferir sempre la solució més simple que funcioni

---

## Canvis a base de dades

Qualsevol canvi que impliqui:

- noves columnes
- modificació de camps
- migracions

ha de:

1. explicar impacte en dades existents
2. indicar si és retrocompatible
3. evitar pèrdua de dades

⚠️ No aplicar canvis destructius sense avisar explícitament

---

## Validació final obligatòria

Abans de donar un canvi per vàlid, Claude ha de verificar mentalment:

- que el codi compilaria / funcionaria
- que no introdueix errors evidents
- que segueix l'estructura existent del projecte
- que no ha oblidat imports, dependències o connexions

Si hi ha dubtes, indicar-ho explícitament.

---

## Filosofia

Sistema dinàmic, simple i controlat per BD

👉 Prioritzar simplicitat i consistència
