import contextlib
import os
from typing import Any
from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from fastapi.encoders import jsonable_encoder

from .settings import Settings

db_metadata = MetaData()
db_settings = Settings()

db_engine = create_async_engine(
    db_settings.db_url,
    json_serializer=jsonable_encoder
)

class LocalSession(AsyncSession):
    pass

local_sessionmaker = async_sessionmaker(
    db_engine,
    class_=LocalSession,
    expire_on_commit=False
)

async def get_db():
    db = local_sessionmaker()
    try:
        yield db
    finally:
        await db.close()
    