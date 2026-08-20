"""initial_schema

Revision ID: cd0957ddda7a
Revises:
Create Date: 2026-08-20 17:57:29.814651

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "cd0957ddda7a"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # price_estimates tablosu (yeni)
    op.create_table(
        "price_estimates",
        sa.Column("service_id", sa.Integer(), nullable=True),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("city_id", sa.Integer(), nullable=True),
        sa.Column("avg_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("min_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("max_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("median_price", sa.Float(), nullable=False, server_default="0"),
        sa.Column("sample_size", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_calculated", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["city_id"], ["cities.id"]),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_price_estimates_category_id"),
        "price_estimates",
        ["category_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_price_estimates_city_id"),
        "price_estimates",
        ["city_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_price_estimates_id"),
        "price_estimates",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_price_estimates_service_id"),
        "price_estimates",
        ["service_id"],
        unique=False,
    )

    # favorites tablosuna yeni sütunlar
    op.add_column("favorites", sa.Column("last_service_id", sa.Integer(), nullable=True))
    op.add_column(
        "favorites", sa.Column("last_request_id", sa.Integer(), nullable=True)
    )
    op.add_column(
        "favorites",
        sa.Column("last_service_date", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("favorites", sa.Column("note", sa.String(length=255), nullable=True))
    op.create_foreign_key(
        "fk_favorites_last_service_id",
        "favorites",
        "services",
        ["last_service_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_favorites_last_request_id",
        "favorites",
        "service_requests",
        ["last_request_id"],
        ["id"],
    )


def downgrade() -> None:
    # favorites sütunlarını geri al
    op.drop_constraint("fk_favorites_last_request_id", "favorites", type_="foreignkey")
    op.drop_constraint("fk_favorites_last_service_id", "favorites", type_="foreignkey")
    op.drop_column("favorites", "note")
    op.drop_column("favorites", "last_service_date")
    op.drop_column("favorites", "last_request_id")
    op.drop_column("favorites", "last_service_id")

    # price_estimates tablosunu sil
    op.drop_index(op.f("ix_price_estimates_service_id"), table_name="price_estimates")
    op.drop_index(op.f("ix_price_estimates_id"), table_name="price_estimates")
    op.drop_index(op.f("ix_price_estimates_city_id"), table_name="price_estimates")
    op.drop_index(
        op.f("ix_price_estimates_category_id"), table_name="price_estimates"
    )
    op.drop_table("price_estimates")
