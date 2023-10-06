import asyncio
# from sqlalchemy import func, or_, select, update
# from db import local_sessionmaker, LocalSession
# import main
# from api.lab.plan.models import ExperimentalPlan_
# from api.lab.work_unit.models import WorkUnit_
# from api.uni.models import Campus
# from api.uni.queries import query_campuses
# from api.uni.research.models import FundingModel_
# from api.uni.research.schemas import FundingModel


# async def test():
#     async with local_sessionmaker() as db:
#         results = await db.scalars(
#             select(Campus)
#                 .where(or_(Campus.name.ilike('%ME%'), Campus.code.ilike('%ME%')))
#         )
#         for result in results:
#             print('result', result)


if __name__ == '__main__':
    def foo():
        x = 0
        l = locals()
        l['x'] = 1
        print('foo', x)

    x = 0
    g = globals()
    g['x'] = 1
    print(x)

    foo()

    # if main.API_DEBUG:
    #     print('running in debug mode. waiting for client...')
        # debugpy.listen(('0.0.0.0', 8765))
        # debugpy.wait_for_client()

    # asyncio.run(test())
    
