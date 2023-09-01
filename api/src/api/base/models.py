from datetime import datetime
from sqlalchemy import TIMESTAMP, ForeignKey
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column
)
from uuid import UUID

from api.utils.db import gen_random_uuid, utcnow

class Base(DeclarativeBase):
    id: Mapped[UUID] = mapped_column(
        primary_key=True, 
        server_default=gen_random_uuid())
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=utcnow())
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), 
        server_default=utcnow(), 
        onupdate=utcnow())