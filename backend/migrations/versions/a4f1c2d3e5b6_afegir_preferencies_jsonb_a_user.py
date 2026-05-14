"""Afegir preferencies JSONB a user

Revision ID: a4f1c2d3e5b6
Revises: 51fe62135e38
Create Date: 2026-05-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a4f1c2d3e5b6'
down_revision = '51fe62135e38'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('preferencies', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('preferencies')
