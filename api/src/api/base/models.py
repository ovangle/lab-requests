from datetime import datetime
from pathlib import Path
from typing import ClassVar
from uuid import UUID
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

class ModelAttachmentBase(Base):
    __model_type__: ClassVar[type[Base]]
    __model_files__: ClassVar[Path]

    model_id: Mapped[UUID]

    def __init_subclass__(cls):
        model_table = cls.__model_type__.__tablename__ 
        setattr(cls, 'model_id', mapped_column(ForeignKey(model_table + '.id')))
