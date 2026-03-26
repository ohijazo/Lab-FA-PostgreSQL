"""Crear taula app_config

Revision ID: 19e26a78a64f
Revises: 57a1c002939c
Create Date: 2026-03-25 15:38:37.534927

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '19e26a78a64f'
down_revision = '57a1c002939c'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('app_config',
    sa.Column('key', sa.String(length=100), nullable=False),
    sa.Column('value', sa.Text(), nullable=False),
    sa.PrimaryKeyConstraint('key')
    )


def downgrade():
    op.drop_table('app_config')
