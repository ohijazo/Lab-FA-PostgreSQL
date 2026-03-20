"""alerta_color split min max

Revision ID: e8e677ee2a55
Revises: b59e7f5f1012
Create Date: 2026-03-20 09:52:04.632193

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e8e677ee2a55'
down_revision = 'b59e7f5f1012'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.add_column(sa.Column('alerta_color_min', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('alerta_color_max', sa.String(length=20), nullable=True))
        batch_op.drop_column('alerta_color')


def downgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.add_column(sa.Column('alerta_color', sa.VARCHAR(length=20), autoincrement=False, nullable=True))
        batch_op.drop_column('alerta_color_max')
        batch_op.drop_column('alerta_color_min')
