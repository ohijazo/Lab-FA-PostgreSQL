"""Afegir alerta i alerta_motiu a analisi

Revision ID: d8a3b1e9f2c4
Revises: c1e3f5d7b8a9
Create Date: 2026-05-14 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd8a3b1e9f2c4'
down_revision = 'c1e3f5d7b8a9'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('analisi', schema=None) as batch_op:
        batch_op.add_column(sa.Column('alerta', sa.Boolean(), nullable=False, server_default=sa.text('false')))
        batch_op.add_column(sa.Column('alerta_motiu', sa.String(length=500), nullable=True))
        batch_op.create_index(batch_op.f('ix_analisi_alerta'), ['alerta'], unique=False)


def downgrade():
    with op.batch_alter_table('analisi', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_analisi_alerta'))
        batch_op.drop_column('alerta_motiu')
        batch_op.drop_column('alerta')
