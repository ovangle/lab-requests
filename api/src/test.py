import asyncio

from sqlalchemy import delete, select
from db import local_sessionmaker

from api.user.models import NativeUser_, User_
from api.user.model_fns import login_native_user, get_user_for_email

async def delete_all_users(db):
    for u in await db.scalars(select(User_)):
        print('deleting user', u.email, 'id: ', u.id)
        await db.execute(delete(User_).where(User_.id == u.id))
    await db.commit()



async def main():
    db = local_sessionmaker()

    user = await NativeUser_.get_for_email(db, "t.stephenson@cqu.edu.au")
    print("password_hash", user.password_hash)
    user.set_password("password")
    db.add(user)
    await db.commit()
    print("password_hash 2", user.password_hash)

    user = await login_native_user(db, "t.stephenson@cqu.edu.au", "password")
    print("user", user)


if __name__ == "__main__":
    asyncio.run(main())
