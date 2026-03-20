"""
Seed script: pobla les opcions dels camps 'analista' i 'fabrica'
amb els valors unics que ja existeixen als registres de la BD.
Tambe canvia el type d'aquests camps a 'select'.

Executar: python seed_opcions.py
"""
from app import create_app, db
from app.models import Camp, Analisi

app = create_app()

CAMPS_A_CONVERTIR = ["analista", "fabrica"]

with app.app_context():
    for camp_name in CAMPS_A_CONVERTIR:
        camps = Camp.query.filter_by(name=camp_name).all()
        if not camps:
            print(f"  Cap camp amb name='{camp_name}' trobat, saltant.")
            continue

        # Recull valors unics de totes les analisis
        analisis = Analisi.query.all()
        valors = set()
        for a in analisis:
            dades = a.get_dades()
            val = dades.get(camp_name, "")
            if isinstance(val, str):
                val = val.strip()
            if val:
                valors.add(val)

        opcions = sorted(valors)
        print(f"  Camp '{camp_name}': {len(camps)} instancia(es), {len(opcions)} opcions trobades: {opcions}")

        for c in camps:
            c.type = "select"
            c.opcions = opcions
            print(f"    -> Camp id={c.id} (seccio_id={c.seccio_id}) actualitzat a type='select' amb {len(opcions)} opcions")

    db.session.commit()
    print("\nFet!")
