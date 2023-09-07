

import asyncio
import os
import re
from asyncio import AbstractEventLoop
from typing import Annotated
from uuid import UUID
from sqlalchemy import MetaData, schema, Column
from sqlalchemy.orm import mapped_column, sessionmaker, Mapped
from sqlalchemy.sql import expression
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.types import DateTime, VARCHAR, TIMESTAMP

from sqlalchemy.dialects import postgresql as pg_dialect

db_metadata = MetaData()

DB_USER = os.environ.get('DB_USER', 'api')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'secret')
DB_HOST = os.environ.get('DB_HOST', '127.0.0.1')
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_NAME = os.environ.get('DB_NAME', 'api')

db_engine = create_async_engine(
    f'postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
)

class LocalSession(AsyncSession):
    pass

local_sessionmaker = async_sessionmaker(db_engine, class_=LocalSession)
async def get_db():
    """
    Provides an injectable context manager for the session, which will attempt
    to close any remaining connections when disposing of the session.
    """
    db = local_sessionmaker()
    try:
        yield db
    finally:
        await db.close() 
    

async def initdb_async():
    import api.main

    async with db_engine.begin() as conn:
        await conn.run_sync(db_metadata.create_all)


async def teardowndb_async():
    import api.main

    async with db_engine.begin() as conn:
        await conn.run_sync(db_metadata.drop_all)


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
    type = pg_dialect.UUID()
    inherit_cache = True

@compiles(gen_random_uuid, 'postgresql')
def pg_gen_random_uuid(element, compiler, **kw):
    return 'gen_random_uuid()'


uuid_pk = Annotated[UUID, mapped_column(pg_dialect.UUID, primary_key=True, server_default=gen_random_uuid())]

# email field

EMAIL_DOMAIN = pg_dialect.DOMAIN(
    'email',
    pg_dialect.CITEXT(128),
    check=r"value ~ '^[a-z0-9].!#$%&''*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$'", 
)

