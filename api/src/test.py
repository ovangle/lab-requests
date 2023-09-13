import asyncio
from sqlalchemy import func, select, update
from db import local_sessionmaker, LocalSession
import main
from api.lab.plan.models import ExperimentalPlan_
from api.lab.work_unit.models import WorkUnit_
from api.uni.research.models import FundingModel_
from api.uni.research.schemas import FundingModel


async def test():
    async with local_sessionmaker() as db:
        for plan in await db.scalars(select(ExperimentalPlan_)):
            count_work_units = await db.scalar(
                select(func.count(WorkUnit_.id))
                    .select_from(WorkUnit_)
                    .where(WorkUnit_.plan_id == plan.id)
            )
            print(plan.id, count_work_units)


        # description = ''

        # query = select(FundingModel_).where(
        #     FundingModel_.description.ilike(rf'%{description}%') 
        # )
        # for result in await db.scalars(query):
        #     funding_model = await FundingModel.from_model(result)
        #     print('result', funding_model)

        #     print(funding_model.model_dump_json())

if __name__ == '__main__':
    import debugpy

    if main.API_DEBUG:
        print('running in debug mode. waiting for client...')
        debugpy.listen(('0.0.0.0', 8765))
        debugpy.wait_for_client()

    asyncio.run(test())
    
