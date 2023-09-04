
from sqlalchemy.ext.asyncio import AsyncSession

from api.utils.db import Session

async def seed_db():
    from api.uni.models import seed_campuses
    async with Session() as db:
        await seed_campuses(db)

if __name__ == '__main__':
    import asyncio 
    loop = asyncio.get_event_loop()
    loop.run_until_complete(seed_db())

    