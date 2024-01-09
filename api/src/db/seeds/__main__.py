import asyncio

from db import local_sessionmaker
from . import seed_all


async def main():
    async with local_sessionmaker() as db:
        await seed_all(db)


if __name__ == "__main__":
    loop = asyncio.get_running_loop()
    loop.run_until_complete(main())
