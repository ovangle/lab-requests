
from sqlalchemy.ext.asyncio import AsyncSession

from api.utils.db import local_sessionmaker

async def seed_db():
    from api.uni.models import seed_campuses
    from api.uni.research.models import seed_funding_models
    async with local_sessionmaker() as db:
        await seed_campuses(db)
        await seed_funding_models(db)

if __name__ == '__main__':
    import asyncio 
    loop = asyncio.get_event_loop()
    loop.run_until_complete(seed_db())

    