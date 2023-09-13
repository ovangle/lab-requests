import asyncio
from sqlalchemy import select
from db import local_sessionmaker, LocalSession
from api.uni.research.models import FundingModel_
from api.uni.research.schemas import FundingModel


async def main():
    async with local_sessionmaker() as db:
        description = ''

        query = select(FundingModel_).where(
            FundingModel_.description.ilike(rf'%{description}%') 
        )
        for result in await db.scalars(query):
            funding_model = await FundingModel.from_model(result)
            print('result', funding_model)

            print(funding_model.model_dump_json())

if __name__ == '__main__':
    asyncio.run(main())
    
