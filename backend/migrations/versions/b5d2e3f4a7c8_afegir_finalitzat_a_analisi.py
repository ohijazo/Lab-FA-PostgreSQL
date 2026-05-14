"""Afegir finalitzat a analisi

Revision ID: b5d2e3f4a7c8
Revises: a4f1c2d3e5b6
Create Date: 2026-05-14 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b5d2e3f4a7c8'
down_revision = 'a4f1c2d3e5b6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('analisi', schema=None) as batch_op:
        batch_op.add_column(sa.Column('finalitzat', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.create_index(batch_op.f('ix_analisi_finalitzat'), ['finalitzat'], unique=False)


def downgrade():
    with op.batch_alter_table('analisi', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_analisi_finalitzat'))
        batch_op.drop_column('finalitzat')
