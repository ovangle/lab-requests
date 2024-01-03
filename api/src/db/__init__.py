import contextlib
import json
import os
from typing import Any
from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from fastapi.encoders import jsonable_encoder

from .engine import db_engine
from .settings import DbSettings
from .session import local_sessionmaker, LocalSession

db_metadata = MetaData()
db_url = DbSettings().db_url


async def get_db():
    db = local_sessionmaker()
    try:
        yield db
    finally:
        await db.close()
