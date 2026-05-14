"""Marcar com a finalitzades totes les anàlisis ja existents

Revision ID: c1e3f5d7b8a9
Revises: b5d2e3f4a7c8
Create Date: 2026-05-14 12:00:00.000000

Aquesta migració només toca dades, no esquema. Marca com a finalitzades
totes les anàlisis que existeixen en el moment d'aplicar-la (estaven
fetes abans d'introduir el camp d'estat, així que s'han de considerar
ja completades).
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'c1e3f5d7b8a9'
down_revision = 'b5d2e3f4a7c8'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE analisi SET finalitzat = true WHERE finalitzat = false")


def downgrade():
    # No es pot revertir amb seguretat: no sabem quines anàlisis es van
    # marcar amb aquesta migració vs marcades manualment.
    pass
