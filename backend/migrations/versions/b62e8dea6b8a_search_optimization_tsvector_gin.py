"""search_optimization_tsvector_gin

Revision ID: b62e8dea6b8a
Revises: cfbdd138b910
Create Date: 2026-08-22 17:55:27.437086

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b62e8dea6b8a'
down_revision: Union[str, None] = 'cfbdd138b910'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # TSVECTOR computed column
    op.execute(
        """
        ALTER TABLE provider_profiles
        ADD COLUMN IF NOT EXISTS search_vector tsvector
        GENERATED ALWAYS AS (
            setweight(to_tsvector('turkish', coalesce(business_name, '')), 'A') ||
            setweight(to_tsvector('turkish', coalesce(bio, '')), 'B')
        ) STORED;
        """
    )

    # CONCURRENTLY indexes (must be outside of migration transaction block)
    with op.get_context().autocommit_block():
        op.execute(
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_provider_profiles_search_vector
            ON provider_profiles USING GIN (search_vector);
            """
        )
        
        op.execute(
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_provider_locations_coords
            ON provider_locations (latitude, longitude);
            """
        )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_provider_locations_coords;")
    op.execute("DROP INDEX IF EXISTS ix_provider_profiles_search_vector;")
    op.execute("ALTER TABLE provider_profiles DROP COLUMN IF EXISTS search_vector;")
