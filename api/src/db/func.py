from sqlalchemy import DateTime, func
from sqlalchemy.sql import expression
from sqlalchemy.ext import compiler

from sqlalchemy.dialects import postgresql as pg_dialect


class utcnow(expression.FunctionElement):
    type = DateTime()
    inherit_cache = True

@compiler.compiles(utcnow, 'postgresql')
def pg_utcnow(element, compiler, **kw):
    return "TIMEZONE('utc', CURRENT_TIMESTAMP)"


class gen_random_uuid(expression.FunctionElement):
    type = pg_dialect.UUID()

@compiler.compiles(gen_random_uuid, 'postgresql')
def pg_gen_random_uuid(element, compiler, **kw):
    return 'gen_random_uuid()'
