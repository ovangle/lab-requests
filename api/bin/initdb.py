#! /usr/bin/env python

import asyncio
from pathlib import Path
from db import db_engine, db_metadata, local_sessionmaker

from alembic.config import Config
from alembic import command

PROJECT_ROOT = Path(__file__).parent.parent
ALEMBIC_CFG = Config(PROJECT_ROOT / 'alembic.ini')

async def initdb():
    # Ensure all models in packages we use are imported into metadata
    import main

    print("initializing db...", end='\t')
    async with db_engine.begin() as db:
        await db.run_sync(db_metadata.create_all)
        command.stamp(ALEMBIC_CFG, "head")
        
    print('done')


async def seed_db():
    from api.uni.models import seed_campuses
    from api.uni.research.models import seed_funding_models
    print('seeding db...', end='\t')
    async with local_sessionmaker() as db:
        await seed_campuses(db)
        await seed_funding_models(db)
    print('done')

async def main():
    await initdb()
    await seed_db()

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())