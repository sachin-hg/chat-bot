import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from src.config import get_settings

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)


def _direct_url(settings) -> str:
    """Build a URL that connects directly to postgres (port 5432), bypassing
    pgbouncer.  Pgbouncer's transaction-mode pool can't handle the prepared
    statements that Alembic / asyncpg emit during migrations."""
    pwd = settings.postgres_password.get_secret_value() if settings.postgres_password else ""
    return (
        f"postgresql+asyncpg://{settings.postgres_user}:{pwd}"
        f"@{settings.postgres_host}:5432/{settings.postgres_db}"
    )


def run_migrations_offline() -> None:
    settings = get_settings()
    context.configure(
        url=_direct_url(settings),
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    settings = get_settings()
    engine = create_async_engine(_direct_url(settings))
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
