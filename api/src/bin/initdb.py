import asyncio
from api.utils.db import initdb_async

loop = asyncio.get_event_loop()

def main():
    loop.run_until_complete(initdb_async())

if __name__ == '__main__':
    main()