import asyncio
from sqlalchemy import select
from api.utils.db import local_sessionmaker, LocalSession
from api.uni.research.models import FundingModel

EVENT_LOOP = asyncio.get_event_loop()

db: LocalSession = local_sessionmaker()


async def main():
    description = ''
    query = select(FundingModel).where(
        FundingModel.description.ilike(rf'%{description}%') 
    )
    for result in await db.scalars(query):
        print(f'result {result.id} (created_at: {result.created_at}) (updated_at: {result.updated_at})')
        print(f'description: {result.description}')

try:
    EVENT_LOOP.run_until_complete(main())
finally:
    EVENT_LOOP.run_until_complete(db.close())
