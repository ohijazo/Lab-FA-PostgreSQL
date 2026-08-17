"""Afegir apte a analisi

Revision ID: a2e7c4b9d1f5
Revises: f8b3d1a9c2e5
Create Date: 2026-08-17 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a2e7c4b9d1f5'
down_revision = 'f8b3d1a9c2e5'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('analisi', schema=None) as batch_op:
        batch_op.add_column(sa.Column('apte', sa.String(length=10), nullable=True))
        batch_op.create_index(batch_op.f('ix_analisi_apte'), ['apte'], unique=False)


def downgrade():
    with op.batch_alter_table('analisi', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_analisi_apte'))
        batch_op.drop_column('apte')
