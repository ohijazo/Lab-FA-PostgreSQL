"""unique constraint camp seccio_id name

Revision ID: 57a1c002939c
Revises: e8e677ee2a55
Create Date: 2026-03-20 14:12:14.516820

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '57a1c002939c'
down_revision = 'e8e677ee2a55'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_camp_seccio_name', ['seccio_id', 'name'])


def downgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.drop_constraint('uq_camp_seccio_name', type_='unique')
