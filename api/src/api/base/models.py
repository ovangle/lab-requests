from datetime import datetime
from sqlalchemy import TIMESTAMP, ForeignKey
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column
)

from db.func import utcnow
from db import db_metadata

class Base(AsyncAttrs, DeclarativeBase):
    __abstract__ = True
    metadata = db_metadata

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=utcnow())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=utcnow(), 
        onupdate=utcnow())