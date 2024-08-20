from __future__ import annotations

from typing import TYPE_CHECKING, Generic, TypeVar
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.models.base import Base
from db.models.fields import uuid_pk

if TYPE_CHECKING:
    from db.models.lab import Lab

from .storable import Storable
from .storage_type import StorageType, STORAGE_TYPE_ENUM

TStorable = TypeVar("TStorable", bound=Storable)


class LabStorage(Base, Generic[TStorable]):
    __tablename__ = "lab_storage"

    id: Mapped[uuid_pk] = mapped_column()

    lab_id: Mapped[UUID] = mapped_column("lab.id")
    lab: Mapped[Lab] = relationship()

    storage_type: Mapped[StorageType] = mapped_column(
        STORAGE_TYPE_ENUM, default=StorageType.STANDARD
    )

    storable_id: Mapped[UUID]

    items: Mapped[list[LabStorageContainer]] = relationship()


class LabStorageContainer(Base, Generic[TStorable]):
    __tablename__ = "lab_storage_container"

    id: Mapped[uuid_pk] = mapped_column()

    storage_id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_storage.id"),
    )
    storage: Mapped[LabStorage] = relationship(back_populates="items")
