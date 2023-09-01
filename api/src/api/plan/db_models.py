from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.types import VARCHAR, TEXT

from api.utils.db import db_metadata, gen_random_uuid, row_metadata_columns

from .work_unit.db_models import *
from .types import ExperimentalPlanType

plans = Table(
    'plans',
    db_metadata,
    Column('id', UUID, primary_key=True, server_default=gen_random_uuid()),
    Column('type', ENUM(ExperimentalPlanType)),
    Column('other_type_description', VARCHAR(64), nullable=True),
    Column('campus', ForeignKey('campuses.id')),
    Column('process_summary', TEXT, server_default=''),

    *row_metadata_columns()
)