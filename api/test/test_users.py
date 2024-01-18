import asyncio
from db import LocalSession, local_sessionmaker
from db.models.user import User, NativeUserCredentials


async def test_users(db: LocalSession):
    user = await User.get_for_email(db, "t.stephenson@cqu.edu.au")

    for credentials in await user.awaitable_attrs.credentials:
        if isinstance(credentials, NativeUserCredentials):
            assert credentials.verify_password("password")


async def main():
    async with local_sessionmaker() as db:
        await test_users(db)


if __name__ == "__main__":
    asyncio.run(main())
