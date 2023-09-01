from sqlalchemy import DATE, MetaData, DATETIME, TEXT, TIMESTAMP, Table, Column, VARCHAR, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.sql import func

from api.utils.db import db_metadata, gen_random_uuid, utcnow, row_metadata_columns

from ..resource.db_models import resource_container_columns

from .types import LabType

work_units = Table(
    'work_units',
    db_metadata,

    Column('id', UUID, primary_key=True, server_default=gen_random_uuid()),
    Column('plan_id', ForeignKey("plans.id"), nullable=False),
    Column('lab_type', ENUM(LabType), nullable=False),
    Column('technician', VARCHAR(128), nullable=False),
    Column('summary', TEXT, server_default=''),
    Column('start_date', DATE),
    Column('end_date', DATE),

    *resource_container_columns(),
    *row_metadata_columns()
)