# Lab FA - LIMS Farinera

Sistema LIMS (Laboratory Information Management System) per registrar anàlisis de laboratori d'una Farinera.

## Stack

- **Backend**: Python + Flask + SQLAlchemy + PostgesSQL
- **Frontend**: React + Vite + React Router + PicoCSS

## Com executar

### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows Git Bash
pip install -r requirements.txt
python run.py                  # → localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                    # → localhost:5173 (proxy /api → :5000)
```

## Tipus d'anàlisi

- **Blat T1**: ~35 camps organitzats en 6 seccions (Identificació, Resultats farina, Alveo 2h, NIR, Especificacions, Qualitat)
