from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Select, select, or_
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from db import LocalSession, local_object_session
from db.models.base import Base
from db.models.base.base import model_id
from db.models.fields import uuid_pk
from db.models.lab import Lab, query_labs
from db.models.lab.installable import LabInstallation, Installable
from db.models.software import Software
from db.models.uni.campus import Campus
from db.models.uni.discipline import DISCIPLINE_ENUM, Discipline

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

    disciplines: Mapped[list[Discipline]] = mapped_column(psql.ARRAY(DISCIPLINE_ENUM), server_default="{}")

    equipment_installations: Mapped[list[EquipmentInstallation]] = relationship(
        back_populates="equipment"
    )

    packaged_software_id: Mapped[UUID | None] = mapped_column(ForeignKey("software.id"), nullable=True)
    packaged_software: Mapped[Software] = relationship()

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        e = await db.get(Equipment, id)
        if e is None:
            raise EquipmentDoesNotExist(for_id=id)
        return e

    async def get_installation(self, lab: Lab | UUID) -> LabInstallation[Equipment]:
        from .equipment_installation import EquipmentInstallation

        db = local_object_session(self)

        return await EquipmentInstallation.get_for_installable_lab(db, self, lab)

def query_equipments(
    search: str | None = None,
    name_eq: str | None = None,
    name_istartswith: str | None = None,
    has_tags: set[str] | None = None,
    lab: Select[tuple[Lab]] | list[Lab | UUID] | Lab | UUID | None = None,
    installed_campus: list[Campus | UUID] | Campus | UUID | None = None,
    installed_discipline: list[Discipline] | Discipline | None = None
) -> Select[tuple[Equipment]]:
    from .equipment_installation import EquipmentInstallation, query_equipment_installations
    clauses: list = []

    if search:
        # TODO: Implement full text search properly.
        clauses.append(
            or_(
                Equipment.name.ilike(f"%{search}%"),
                Equipment.description.ilike(f"%{search}%")
            )
        )

    if (lab is not None) or (installed_campus is not None) or (installed_discipline is not None):
        installations = query_equipment_installations(
            lab=lab,
            installed_campus=installed_campus,
            installed_discipline=installed_discipline
        )
        clauses.append(Equipment.id.in_(
            installations.select(EquipmentInstallation.equipment_id).scalar_subquery())
        )

    if name_eq is not None:
        clauses.append(Equipment.name == name_eq)
    elif name_istartswith:
        clauses.append(Equipment.name._ilike(f"{name_istartswith}%"))

    if has_tags:
        clauses.append(*[Equipment.tags.contains(tag) for tag in has_tags])

    return select(Equipment).where(*clauses)
