from __future__ import annotations

from abc import abstractclassmethod, abstractmethod
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
from db import LocalSession, get_db

from .errors import DoesNotExist

metadata = MetaData()


class Base(AsyncAttrs, DeclarativeBase):
    __abstract__ = True
    metadata = metadata

    id: Mapped[UUID]

    created_at: Mapped[datetime] = mapped_column(
        postgresql.TIMESTAMP(timezone=True), server_default=utcnow()
    )
    updated_at: Mapped[datetime] = mapped_column(
        postgresql.TIMESTAMP(timezone=True), server_default=utcnow(), onupdate=utcnow()
    )

    @classmethod
    async def get_by_id(cls, db: LocalSession, id: UUID):
        o = await db.get(cls, id)
        if o is None:
            raise DoesNotExist(cls, for_id=id)
        return o


def model_id(ref: Base | UUID) -> UUID:
    if isinstance(ref, UUID):
        return ref
    return ref.id


TModel = TypeVar("TModel", bound=Base)


async def resolve_model_ref(
    db: LocalSession, model_type: type[TModel], ref: TModel | UUID
) -> TModel:
    if isinstance(ref, UUID):
        return await model_type.get_by_id(db, ref)
    return ref
