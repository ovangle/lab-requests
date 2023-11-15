import asyncio
from sqlalchemy import select, delete
# from sqlalchemy import func, or_, select, update
from db import local_sessionmaker, LocalSession
from api.user.models import AbstractUser, seed_users, NativeUser

async def pretest():
    async with local_sessionmaker() as db:
        await db.execute(delete(NativeUser).where())

async def test():
    await pretest()
    async with local_sessionmaker() as db:
        await seed_users(db)
        all_native_users = await db.scalars(select(NativeUser).where())
        for user in all_native_users:
            print('user', user.email)
        user = await AbstractUser.get_for_email(db, 't.stephenson@cqu.edu.au')
        print(f'name: {user.name}')
        print(f'active: {not user.disabled}')
        print(f'roles: {user.roles}')
        
if __name__ == '__main__':
    asyncio.run(test())
    
