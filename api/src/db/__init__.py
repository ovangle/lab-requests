from pathlib import Path
import json

from alembic import command
from alembic.config import Config
from fastapi.encoders import jsonable_encoder

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
    async_object_session,
)


from .settings import DbSettings

settings = DbSettings()
url = settings.db_url

engine = create_async_engine(
    url,
    json_serializer=lambda d: json.dumps(jsonable_encoder(d)),
)


class LocalSession(AsyncSession):
    """
    An async session that is local to the current api request.
    """

    pass


local_sessionmaker = async_sessionmaker(
    engine, class_=LocalSession, expire_on_commit=False
)


def local_object_session(obj) -> LocalSession:
    session = async_object_session(obj)
    if not isinstance(session, LocalSession):
        raise RuntimeError("Object detached from session")
    return session


async def get_db():
    db = local_sessionmaker()
    try:
        yield db
    finally:
        await db.close()


def _get_alembic_config():
    dir = Path(__file__).parent

    while not (dir / "alembic.ini").exists():
        if dir.parent == dir:
            raise ValueError("alembic.ini not found in any parent directory")
        dir = dir.parent
    return Config(dir / "alembic.ini")


async def init_db():
    from .models.base import Base

    alembic_cfg = _get_alembic_config()

    async with engine.begin() as db:
        await db.run_sync(Base.metadata.create_all)
        command.stamp(alembic_cfg, "head")


async def seed_db():
    from .seeds import seed_all

    async with local_sessionmaker() as db:
        await seed_all(db)
