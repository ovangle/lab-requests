import asyncio
from api.utils.db import teardowndb_async 

loop = asyncio.get_event_loop()

def main():
    loop.run_until_complete(teardowndb_async())

if __name__ == '__main__':
    main()