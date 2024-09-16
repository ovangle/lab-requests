from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Column, ForeignKey, Select, Table, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql

from db import LocalSession
from db.models.base import Base, DoesNotExist, model_id
from db.models.fields import uuid_pk

if TYPE_CHECKING:
    from db.models.lab import Lab

lab_supported_storage_strategies = Table(
    "lab_supported_storage_strategies",
    Base.metadata,
    Column("lab_id", ForeignKey("lab.id"), primary_key=True),
    Column("storage_strategy_id", ForeignKey("lab_storage_strategy.id"), primary_key=True)
)

class LabStorageStrategy(Base):
    __tablename__ = "lab_storage_strategy"

    id: Mapped[uuid_pk] = mapped_column()
    name: Mapped[str] = mapped_column(postgresql.VARCHAR(64), index=True, unique=True)

    description: Mapped[str] = mapped_column(postgresql.TEXT)

    supported_in_labs: Mapped[list[Lab]] = relationship(
        secondary=lab_supported_storage_strategies
    )

    @classmethod
    async def get_for_name(cls, db: LocalSession, name: str):
        r = await db.scalar(
            select(LabStorageStrategy).where(LabStorageStrategy.name == name)
        )
        if r is None:
            raise DoesNotExist('StorageStrategy', f"No storage strategy '{name}'")
        return r

    @classmethod
    def select_allowed_for_lab(cls, lab: Lab | UUID) -> Select[tuple[LabStorageStrategy]]:
        select_related = select(lab_supported_storage_strategies.c.storage_strategy_id).where(
            lab_supported_storage_strategies.c.lab_id == model_id(lab)
        )

        return select(LabStorageStrategy).where(
            LabStorageStrategy.id.in_(select_related)
        )