# import asyncio

# from sqlalchemy import delete, select
# from api.uni.models import Campus
# from api.lab.models import Lab_
# from db import async_sessionmaker

# from api.lab.models import lab_supervisor
# from api.user.models import NativeUserCredentials_, User_
# from api.user.model_fns import login_native_user, get_user_for_email


# async def delete_all_users(db):
#     for u in await db.scalars(select(User_)):
#         print("deleting user", u.email, "id: ", u.id)
#         await db.execute(delete(lab_supervisor).where(lab_supervisor.c.user_id == u.id))
#         await db.execute(
#             delete(NativeUserCredentials_).where(NativeUserCredentials_.user_id == u.id)
#         )
#         await db.execute(delete(User_).where(User_.id == u.id))
#     await db.commit()


# async def main():
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


# if __name__ == "__main__":
#     asyncio.run(main())
