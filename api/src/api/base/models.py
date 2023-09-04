from datetime import datetime
from sqlalchemy import TIMESTAMP, ForeignKey
from sqlalchemy.orm import (
    declarative_base,
    Mapped,
    mapped_column
)
from uuid import UUID

from api.utils.db import gen_random_uuid, utcnow, db_metadata

class Base(declarative_base(metadata=db_metadata)):
    __abstract__ = True

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=utcnow())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=utcnow(), 
        onupdate=utcnow())