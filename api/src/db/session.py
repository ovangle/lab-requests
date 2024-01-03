from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    async_object_session,
)
from .engine import db_engine


class LocalSession(AsyncSession):
    pass


local_sessionmaker = async_sessionmaker(
    db_engine, class_=LocalSession, expire_on_commit=False
)

session_from_object = async_object_session
