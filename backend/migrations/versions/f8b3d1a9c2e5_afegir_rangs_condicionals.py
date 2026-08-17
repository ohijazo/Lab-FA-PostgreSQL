"""Afegir camp_controlador a tipus_analisi i rangs_condicionals a camp

Revision ID: f8b3d1a9c2e5
Revises: e7c4a2b1d6f3
Create Date: 2026-08-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = 'f8b3d1a9c2e5'
down_revision = 'e7c4a2b1d6f3'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('tipus_analisi', schema=None) as batch_op:
        batch_op.add_column(sa.Column('camp_controlador', sa.String(length=100), nullable=True))

    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.add_column(sa.Column('rangs_condicionals', JSONB(), nullable=True))


def downgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.drop_column('rangs_condicionals')

    with op.batch_alter_table('tipus_analisi', schema=None) as batch_op:
        batch_op.drop_column('camp_controlador')
