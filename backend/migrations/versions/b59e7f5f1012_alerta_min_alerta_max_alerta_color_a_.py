"""alerta_min alerta_max alerta_color a camp

Revision ID: b59e7f5f1012
Revises: d00d70848d73
Create Date: 2026-03-20 09:42:09.272803

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b59e7f5f1012'
down_revision = 'd00d70848d73'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.add_column(sa.Column('alerta_min', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('alerta_max', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('alerta_color', sa.String(length=20), nullable=True))


def downgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.drop_column('alerta_color')
        batch_op.drop_column('alerta_max')
        batch_op.drop_column('alerta_min')
