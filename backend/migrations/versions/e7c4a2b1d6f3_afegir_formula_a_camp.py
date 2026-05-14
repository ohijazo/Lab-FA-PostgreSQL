"""Afegir formula a camp

Revision ID: e7c4a2b1d6f3
Revises: d8a3b1e9f2c4
Create Date: 2026-05-14 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e7c4a2b1d6f3'
down_revision = 'd8a3b1e9f2c4'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.add_column(sa.Column('formula', sa.String(length=500), nullable=True))


def downgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.drop_column('formula')
