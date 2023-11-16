import asyncio
from logging.config import fileConfig
from typing import Any, cast

from sqlalchemy import MetaData, pool, engine_from_config
from sqlalchemy.ext.asyncio import async_engine_from_config, AsyncConnection

from alembic import context # type: ignore

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def import_db_module():
    """
    Ensures that the db module is available on the system path
    before importing and returning it. 

    Also as a side-effect imports main, ensuring that all models 
    are loaded into the target metadata.
    """
    try:
        import db, main
    except ImportError:
        import sys, pathlib
        project_root = pathlib.Path(__file__).parent.parent
        sys.path.append(str(project_root / 'src'))
        import db, main
    return db
db = import_db_module()

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata: MetaData = db.db_metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    context.configure(
        url=db.db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    def do_run_migrations(connection):
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=db.db_url
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
        

if context.is_offline_mode():
    run_migrations_offline()
else:
    loop: asyncio.AbstractEventLoop | None
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        task = loop.create_task(run_migrations_online())
        task.add_done_callback(lambda t: f'Migrations complete with result {t.result()}')

    else:
        asyncio.run(run_migrations_online())