from __future__ import annotations

from asyncio import Future
from datetime import datetime
import functools
from typing import Generic, NewType, TypeVar
from uuid import UUID

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, declared_attr
from sqlalchemy.dialects import postgresql

from sqlalchemy.ext.asyncio import AsyncAttrs

from db.func import utcnow

metadata = MetaData()


class Base(AsyncAttrs, DeclarativeBase):
    __abstract__ = True
    metadata = metadata

    created_at: Mapped[datetime] = mapped_column(
        postgresql.TIMESTAMP(timezone=True), server_default=utcnow()
    )
    updated_at: Mapped[datetime] = mapped_column(
        postgresql.TIMESTAMP(timezone=True), server_default=utcnow(), onupdate=utcnow()
    )
