from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from db import LocalSession
from db.models.lab.installable.lab_installation import LabInstallation

from ..base import Base
from ..fields import uuid_pk
from ..lab.installable.installable import Installable

from .errors import EquipmentDoesNotExist

if TYPE_CHECKING:
    from .equipment_installation import EquipmentInstallation


class Equipment(Installable, Base):
    __tablename__ = "equipment"

    id: Mapped[uuid_pk] = mapped_column()
    name: Mapped[str] = mapped_column(psql.VARCHAR(128), index=True)
    description: Mapped[str] = mapped_column(psql.TEXT, default="")

    tags: Mapped[list[str]] = mapped_column(psql.ARRAY(psql.TEXT), server_default="{}")
    training_descriptions: Mapped[list[str]] = mapped_column(
        psql.ARRAY(psql.TEXT), server_default="{}"
    )

    equipment_installations: Mapped[list[EquipmentInstallation]] = relationship(
        back_populates="equipment"
    )

    async def installations(self) -> list[LabInstallation]:
        return await self.awaitable_attrs.equipment_installations

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        e = await db.get(Equipment, id)
        if e is None:
            raise EquipmentDoesNotExist(for_id=id)
        return e


def query_equipments(
    lab: UUID | None = None,
    name_eq: str | None = None,
    name_istartswith: str | None = None,
    has_tags: set[str] | str | None = None,
) -> Select[tuple[Equipment]]:
    clauses: list = []

    if lab is not None:
        subquery = (
            select(EquipmentInstallation.equipment_id)
            .where(EquipmentInstallation.lab_id == lab)
            .scalar_subquery()
        )
        clauses.append(Equipment.id.in_(subquery))

    if name_eq is not None:
        clauses.append(Equipment.name == name_eq)
    elif name_istartswith:
        clauses.append(Equipment.name._ilike(f"{name_istartswith}%"))

    if isinstance(has_tags, str):
        has_tag = set([has_tags])

    if has_tags:
        clauses.append(*[Equipment.tags.contains(tag) for tag in has_tags])

    return select(Equipment).where(*clauses)
