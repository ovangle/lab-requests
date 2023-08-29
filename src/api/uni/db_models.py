from sqlalchemy import Table, Column
from sqlalchemy.types import VARCHAR, CHAR
from sqlalchemy.dialects.postgresql import UUID

from api.utils.db import db_metadata, db_engine, gen_random_uuid, row_metadata_columns

campuses = Table(
    'campuses',
    db_metadata,
    Column('id', UUID, primary_key=True, server_default=gen_random_uuid()),
    Column('code', CHAR(3)),
    Column('description', VARCHAR(64), nullable=True, unique=True),
    *row_metadata_columns()
)

async def seed_campuses():
    raise NotImplementedError('seed_campuses')