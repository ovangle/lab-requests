import os
from typing import Annotated
from sqlalchemy import MetaData, schema, Column
from sqlalchemy.orm import mapped_column, sessionmaker
from sqlalchemy.sql import expression
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
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

Session = async_sessionmaker(db_engine)

async def initdb_async():
    import api.uni.models
    import api.plan.models

    async with db_engine.begin() as conn:
        await conn.run_sync(db_metadata.create_all)
        await api.uni.models.seed_campuses()

def initdb():
    import asyncio; loop = asyncio.get_event_loop()
    loop.run_until_complete(initdb_async())

async def teardown_db_async():
    import api.uni.models
    import api.plan.models

    async with db_engine.begin() as conn:
        await conn.run_sync(db_metadata.drop_all)

def teardowndb():
    import asyncio; loop = asyncio.get_event_loop()
    loop.run_until_complete(teardown_db_async())

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


uuid_pk = Annotated[UUID, mapped_column(primary_key=True, server_default=gen_random_uuid())]