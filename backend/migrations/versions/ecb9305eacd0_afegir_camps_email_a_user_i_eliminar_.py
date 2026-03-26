"""Afegir camps email a user i eliminar app_config

Revision ID: ecb9305eacd0
Revises: 19e26a78a64f
Create Date: 2026-03-26 07:54:24.094240

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ecb9305eacd0'
down_revision = '19e26a78a64f'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table('app_config')
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email_smtp_password', sa.String(length=256), nullable=True))
        batch_op.add_column(sa.Column('email_from_name', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('email_from_address', sa.String(length=120), nullable=True))


def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('email_from_address')
        batch_op.drop_column('email_from_name')
        batch_op.drop_column('email_smtp_password')

    op.create_table('app_config',
    sa.Column('key', sa.VARCHAR(length=100), autoincrement=False, nullable=False),
    sa.Column('value', sa.TEXT(), autoincrement=False, nullable=False),
    sa.PrimaryKeyConstraint('key', name=op.f('app_config_pkey'))
    )
