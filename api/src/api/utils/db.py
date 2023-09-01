import os
from sqlalchemy import MetaData, schema, Column
from sqlalchemy.sql import expression
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.types import DateTime, VARCHAR, TIMESTAMP

from sqlalchemy.dialects.postgresql import dialect as pg_dialect
from sqlalchemy.dialects.postgresql import UUID


db_metadata = MetaData()

DB_USER = os.environ.get('DB_USER', 'api')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'api')
DB_HOST = os.environ.get('DB_HOST', '127.0.0.1')
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_NAME = os.environ.get('DB_NAME', 'api')

db_engine = create_async_engine(
    f'postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
)

async def init_db():
    import api.uni.db_models
    import api.plan.db_models

    async with db_engine.begin() as conn:
        await conn.run_sync(db_metadata.create_all)

def run_init_db():
    import asyncio; loop = asyncio.get_event_loop()
    loop.run_until_complete(init_db())

async def teardown_db():
    import api.uni.db_models
    import api.plan.db_models

    async with db_engine.begin() as conn:
        await conn.run_sync(db_metadata.drop_all)

def run_teardown_db():
    import asyncio; loop = asyncio.get_event_loop()
    loop.run_until_complete(teardown_db())

def row_metadata_columns() -> list[Column]:
    return [
        Column('created_by', VARCHAR(64)),
        Column('created_at', TIMESTAMP(timezone=True), server_default=utcnow()),
        Column('updated_at', TIMESTAMP(timezone=True), server_default=utcnow(), onupdate=utcnow())
    ]

### utcnow() function

class utcnow(expression.FunctionElement):
    type = DateTime()
    inherit_cache = True

@compiles(utcnow, 'postgresql')
def pg_utcnow(element, compiler, **kw):
    return "TIMEZONE('utc', CURRENT_TIMESTAMP)"


### gen_random_uuid() function

class gen_random_uuid(expression.FunctionElement):
    type = UUID()
    inherit_cache = True

@compiles(gen_random_uuid, 'postgresql')
def pg_gen_random_uuid(element, compiler, **kw):
    return 'gen_random_uuid()'


