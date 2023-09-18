from uuid import UUID

from sqlalchemy import select, Select
from sqlalchemy.dialects import postgresql as pg_dialect
from . import schemas, models

def query_equipment_tags(
    attached_to: schemas.Equipment | UUID | None = None,
    name_istartswith: str | None = None
) -> Select[tuple[models.EquipmentTag]]: 
    clauses = []

    if name_istartswith:
        clauses.append(
            models.EquipmentTag.name._ilike(f'{name_istartswith}%')
        )

    if attached_to:
        if isinstance(attached_to, schemas.Equipment):
            attached_to_id = attached_to.id
        else:
            attached_to_id = attached_to
        subquery = (
            select(models.EquipmentTag) 
            .join(models.Equipment)
            .where(models.Equipment.id == attached_to_id)
        ) 
        clauses.append(
            models.EquipmentTag.id.in_(subquery.select(models.EquipmentTag.id)
            )
        )
        
    return select(models.EquipmentTag).where(*clauses)

def query_equipments(
    name_eq: str | None = None,
    name_istartswith: str | None = None,
    equipment_tag: schemas.EquipmentTag | str | None = None,
) -> Select[tuple[models.Equipment]]:
    clauses = []

    if name_eq is not None:
        clauses.append(models.Equipment.name == name_eq)
    elif name_istartswith:
        clauses.append(models.Equipment.name._ilike(f'{name_istartswith}%'))
    
    if equipment_tag:
        if isinstance(equipment_tag, str):
            where_tag = models.EquipmentTag.name == equipment_tag
        else:
            where_tag = models.Equipment.id == equipment_tag.id

        clauses.append(
            models.Equipment.id.in_(
                select(models.Equipment.id)
                    .join(models.EquipmentTag)
                    .where(where_tag)
            )
        )
    return select(models.Equipment).where(*clauses)

        