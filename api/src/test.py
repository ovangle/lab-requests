import asyncio
from uuid import UUID

from sqlalchemy import delete, func, select
from db import local_sessionmaker
from db.models.research.funding.research_budget import ResearchBudget, query_research_budgets
from db.models.research.funding.research_funding import ResearchFunding, query_research_fundings


# async def delete_all_users(db):
#     for u in await db.scalars(select(User_)):
#         print("deleting user", u.email, "id: ", u.id)
#         await db.execute(delete(lab_supervisor).where(lab_supervisor.c.user_id == u.id))
#         await db.execute(
#             delete(NativeUserCredentials_).where(NativeUserCredentials_.user_id == u.id)
#         )
#         await db.execute(delete(User_).where(User_.id == u.id))
#     await db.commit()


async def main():
    async with local_sessionmaker() as session:
        query = query_research_budgets(funding=query_research_fundings(name_eq="lab"))

        for b in await session.scalars(query):
            print(b)
    print('done')

#     async with async_sessionmaker() as db:
#         await delete_all_users(db)
#         # user = await User_.get_for_email(db, "t.stephenson@cqu.edu.au")
#         # credentials = await user.awaitable_attrs.credentials
#         # if not credentials:
#         #     credentials = NativeUserCredentials_(user.id, "password")
#         #     db.add(credentials)
#         #     await db.commit()

#         # print("password_hash", credentials.password_hash)
#         # credentials.set_password("password")
#         # db.add(credentials)
#         # await db.commit()
#         # print("password_hash 2", credentials.password_hash)

#         # user = await login_native_user(db, "t.stephenson@cqu.edu.au", "password")
#         # print("user", user)

#         # labs = await db.scalars(select(Lab_))
#         # for lab in labs:
#         #     print("lab", lab)
#         #     for supervisor in lab.supervisors:
#         #         print("supervisor", supervisor)


if __name__ == "__main__":
    result = asyncio.run(main())
    print('result', result)
