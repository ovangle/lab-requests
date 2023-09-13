#! /usr/bin/env python

import asyncio
from db import db_engine, db_metadata, local_sessionmaker


async def initdb():
    # Ensure all models in packages we use are imported into metadata
    import main

    async with db_engine.begin() as db:
        await db.run_sync(db_metadata.create_all)

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(initdb())