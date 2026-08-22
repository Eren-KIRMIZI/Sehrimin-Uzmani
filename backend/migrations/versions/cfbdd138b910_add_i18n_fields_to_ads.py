"""add i18n fields to ads

Revision ID: cfbdd138b910
Revises: cd0957ddda7a
Create Date: 2026-08-22 16:04:33.402078

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cfbdd138b910'
down_revision: Union[str, None] = 'cd0957ddda7a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('ads', 'title', new_column_name='title_tr')
    op.alter_column('ads', 'description', new_column_name='description_tr')
    op.add_column('ads', sa.Column('title_en', sa.String(200), nullable=True))
    op.add_column('ads', sa.Column('description_en', sa.Text, nullable=True))


def downgrade() -> None:
    op.drop_column('ads', 'description_en')
    op.drop_column('ads', 'title_en')
    op.alter_column('ads', 'description_tr', new_column_name='description')
    op.alter_column('ads', 'title_tr', new_column_name='title')
