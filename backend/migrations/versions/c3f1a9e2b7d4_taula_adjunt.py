"""taula adjunt (imatges i videos d'un analisi)

Revision ID: c3f1a9e2b7d4
Revises: a2e7c4b9d1f5
Create Date: 2026-08-28 16:10:00.000000

Escrita a ma expressament: l'autogenerate d'Alembic vol eliminar els indexs
JSONB creats per SQL cru (ix_analisi_dades_gin, ix_analisi_dades_data,
ix_analisi_tipus_data) perque no son al model. NO s'han de tocar.

El downgrade nomes esborra la taula: els fitxers del disc (UPLOAD_FOLDER)
s'han d'esborrar a ma si es vol desfer del tot.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3f1a9e2b7d4'
down_revision = 'a2e7c4b9d1f5'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'adjunt',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('analisi_id', sa.Integer(), nullable=False),
        sa.Column('tipus_slug', sa.String(length=50), nullable=False, server_default=''),
        sa.Column('nom', sa.String(length=255), nullable=False),
        sa.Column('fitxer', sa.String(length=120), nullable=False),
        sa.Column('fitxer_thumb', sa.String(length=120), nullable=True),
        sa.Column('mime', sa.String(length=100), nullable=False, server_default=''),
        sa.Column('kind', sa.String(length=10), nullable=False, server_default='image'),
        sa.Column('mida', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comentari', sa.String(length=300), nullable=True),
        sa.Column('pujat_per', sa.String(length=120), nullable=False, server_default=''),
        sa.Column('pujat_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['analisi_id'], ['analisi.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('adjunt', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_adjunt_analisi_id'), ['analisi_id'], unique=False)


def downgrade():
    with op.batch_alter_table('adjunt', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_adjunt_analisi_id'))
    op.drop_table('adjunt')
