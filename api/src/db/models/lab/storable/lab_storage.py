from __future__ import annotations

from typing import TYPE_CHECKING, Generic, TypeVar
from uuid import UUID

from sqlalchemy import ForeignKey, Select, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import local_object_session
from db.models.base import Base, model_id
from db.models.fields import uuid_pk

if TYPE_CHECKING:
    from db.models.lab import Lab

from .storable import Storable, get_storable
from .storage_strategy import LabStorageStrategy

TStorable = TypeVar("TStorable", bound=Storable)


class LabStorage(Base, Generic[TStorable]):
    """
    Represents a method for storing items in a lab.

    Each storage is seperated into multiple containers, each of which can contain one or more items

    """
    __tablename__ = "lab_storage"

    id: Mapped[uuid_pk] = mapped_column()

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship(back_populates="storages")

    strategy_id: Mapped[UUID] = mapped_column(ForeignKey("lab_storage_strategy.id"))
    strategy: Mapped[LabStorageStrategy] = relationship()

    containers: Mapped[list[LabStorageContainer]] = relationship(back_populates='storage')

def query_lab_storages(
    lab: Lab | UUID | None = None,
    strategy: LabStorageStrategy | UUID | None = None
):
    where_clauses: list = []

    if lab:
        where_clauses.append(
            LabStorage.lab_id == model_id(lab)
        )

    if strategy:
        where_clauses.append(
            LabStorage.strategy_id == model_id(strategy)
        )

    return select(LabStorage).where(*where_clauses)


class LabStorageContainer(Base, Generic[TStorable]):
    __tablename__ = "lab_storage_container"

    id: Mapped[uuid_pk] = mapped_column()

    storage_id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_storage.id"),
    )
    storage: Mapped[LabStorage] = relationship(back_populates="containers")


def query_lab_storage_containers(
    lab: Lab | UUID | None = None,
    storage: LabStorage | UUID | None = None
) -> Select[tuple[LabStorageContainer]]:
    where_clauses: list = []

    if lab:
        storages = query_lab_storages(lab)
        where_clauses.append(LabStorageContainer.storage_id.in_(storages.scalar_subquery()))

    if storage:
        where_clauses.append(LabStorageContainer.storage_id == storage)

    return select(LabStorageContainer).where(*where_clauses)
