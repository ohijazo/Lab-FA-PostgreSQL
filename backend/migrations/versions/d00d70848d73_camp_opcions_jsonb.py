"""camp opcions jsonb

Revision ID: d00d70848d73
Revises: 5c91ed62e267
Create Date: 2026-03-20 09:00:22.785095

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd00d70848d73'
down_revision = '5c91ed62e267'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.add_column(sa.Column('opcions', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade():
    with op.batch_alter_table('camp', schema=None) as batch_op:
        batch_op.drop_column('opcions')
