import asyncio

from . import seed_all

if __name__ == "__main__":
    loop = asyncio.get_running_loop()
    loop.run_until_complete(seed_all())
