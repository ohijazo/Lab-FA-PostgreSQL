import os
import click
from dotenv import load_dotenv
load_dotenv()

from app import create_app, db

app = create_app()


@app.cli.command("seed-admin")
def seed_admin():
    """Crea l'usuari admin si no existeix."""
    from app.models import User

    email = os.environ.get("ADMIN_EMAIL", "admin@lab-fa.local")
    password = os.environ.get("ADMIN_PASSWORD", "changeme")

    if User.query.filter_by(email=email).first():
        click.echo(f"L'usuari {email} ja existeix.")
        return

    u = User(email=email, nom="Administrador", role="admin")
    u.set_password(password)
    db.session.add(u)
    db.session.commit()
    click.echo(f"Usuari admin creat: {email}")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
