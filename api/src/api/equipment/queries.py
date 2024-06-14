from uuid import UUID

from sqlalchemy import select, Select
from sqlalchemy.dialects import postgresql as pg_dialect

from db.models.equipment import Equipment, EquipmentInstallation

# FIXME: move this stuff to db.models


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
