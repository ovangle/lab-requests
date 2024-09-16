import asyncio
import os
import click
import debugpy

@click.group()
@click.option('--debug/--no-debug', default=True, help='disable the debugger')
@click.option('--debugger-port', default=8765, help='start debugger on {_debugger_port}')
@click.option(
    '--debug-wait-client/--no-debug-wait-client',
    default=False,
    help='wait for a debug client to be attached before proceeding with initialisation'
)
def cli(
    debug: bool,
    debugger_port: int,
    debug_wait_client: bool,
):
    if debug:
        debugpy.listen(("0.0.0.0", debugger_port))

        print(f'debugger running on {debugger_port}.')

        if debug_wait_client:
            print('waiting for a client to connect...', end='\t')
            debugpy.wait_for_client()
            print('connected!')
        print()

@cli.group('db')
def db_group():
    pass

@db_group.command('init')
def db_init():
    from db import init_db
    return asyncio.run(init_db())

@db_group.command('seed')
def db_seed():
    from db import seed_db
    return asyncio.run(seed_db())

@cli.group('api')
def api_group():
    pass

@api_group.command('serve')
def api_serve():
    from api import serve
    serve()

if __name__ == '__main__':
    cli()