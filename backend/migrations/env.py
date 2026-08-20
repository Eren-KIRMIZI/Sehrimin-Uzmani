import sys
from pathlib import Path
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import engine, Base
from app.core.config import settings

# tum modelleri import et — autogenerate icin gerekli
import app.modules.users.models  # noqa: F401
import app.modules.auth.models  # noqa: F401
import app.modules.categories.models  # noqa: F401
import app.modules.providers.models  # noqa: F401
import app.modules.requests.models  # noqa: F401
import app.modules.reviews.models  # noqa: F401
import app.modules.messaging.models  # noqa: F401
import app.modules.favorites.models  # noqa: F401
import app.modules.notifications.models  # noqa: F401
import app.modules.pricing.models  # noqa: F401
import app.modules.quotes.models  # noqa: F401
import app.modules.disputes.models  # noqa: F401
import app.modules.appointments.models  # noqa: F401
import app.modules.commissions.models  # noqa: F401
import app.modules.promotions.models  # noqa: F401
import app.modules.subscriptions.models  # noqa: F401
import app.modules.locations.models  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
