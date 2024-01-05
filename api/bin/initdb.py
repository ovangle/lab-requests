#! /usr/bin/env python

import asyncio
from pathlib import Path

from alembic.config import Config
from alembic import command

PROJECT_ROOT = Path(__file__).parent.parent
try:
    from db import db_engine, db_metadata, local_sessionmaker
except ImportError:
    import sys

    sys.path.append(str(PROJECT_ROOT / "src"))
    from db import db_engine, db_metadata, local_sessionmaker


ALEMBIC_CFG = Config(PROJECT_ROOT / "alembic.ini")


async def initdb():
    # Ensure all models in packages we use are imported into metadata
    import main

    print("initializing db...", end="\t")
    async with db_engine.begin() as db:
        await db.run_sync(db_metadata.create_all)
        command.stamp(ALEMBIC_CFG, "head")

    print("done")


def log_seed_fn(name, seed_fn):
    async def do_seed(db, **kwargs):
        print(f"seeding {name}", end="\t")
        await seed_fn(db, **kwargs)
        print("done")

    return do_seed


async def seed_db():
    from api.uni.models import seed_campuses
    from api.uni.research.models import seed_funding_models
    from api.user.models import seed_users
    from api.lab.models import seed_labs, seed_lab_supervisors

    print("seeding db...")
    async with local_sessionmaker() as db:
        await log_seed_fn("campuses", seed_campuses)(db)
        await log_seed_fn("funding_models", seed_funding_models)(db)
        await log_seed_fn("users", seed_users)(db, project_root=PROJECT_ROOT)
        await log_seed_fn("labs", seed_labs)(db)
        await log_seed_fn("lab_supervisors", seed_lab_supervisors)(
            db, project_root=PROJECT_ROOT
        )

    print("done")


async def main():
    await initdb()
    await seed_db()


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
