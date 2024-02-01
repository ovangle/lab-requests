from uuid import UUID

from sqlalchemy import select, Select
from sqlalchemy.dialects import postgresql as pg_dialect

from db.models.lab.lab_equipment import LabEquipment, LabEquipmentInstallation
from . import schemas

# FIXME: move this stuff to db.models


def query_equipments(
    lab: UUID | None = None,
    name_eq: str | None = None,
    name_istartswith: str | None = None,
    has_tags: set[str] | str | None = None,
) -> Select[tuple[LabEquipment]]:
    clauses: list = []

    if lab is not None:
        subquery = (
            select(LabEquipmentInstallation.equipment_id)
            .where(LabEquipmentInstallation.lab_id == lab)
            .scalar_subquery()
        )
        clauses.append(LabEquipment.id.in_(subquery))

    if name_eq is not None:
        clauses.append(LabEquipment.name == name_eq)
    elif name_istartswith:
        clauses.append(LabEquipment.name._ilike(f"{name_istartswith}%"))

    if isinstance(has_tags, str):
        has_tag = set([has_tags])

    if has_tags:
        clauses.append(*[LabEquipment.tags.contains(tag) for tag in has_tags])

    return select(LabEquipment).where(*clauses)
