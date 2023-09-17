from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends

from sqlalchemy import select
from api.lab.equipment.queries import query_equipment_tags

from db import get_db
from api.base.schemas import PagedResultList

from .schemas import Equipment, EquipmentPatch, EquipmentTag

from . import models

lab_equipment_tags = APIRouter(
    prefix="/lab/equipments/tags",
    tags=["lab-equipment", "lab-equipment-tags"]
)

@lab_equipment_tags.get('/')
async def index_equipment_tags(
    name_istartswith: Optional[str] = None,
    db = Depends(get_db)
) -> PagedResultList[EquipmentTag]: 
    return await PagedResultList[EquipmentTag].from_selection(
        EquipmentTag,
        db,
        query_equipment_tags(name_istartswith=name_istartswith),
    )

lab_equipments = APIRouter(
    prefix="/lab/equipments",
    tags=["lab-equipments"]
)

@lab_equipments.get('/')
async def query_equipments(
    name_starts_with: Optional[str] = None,
    name: Optional[str] = None,
    db = Depends(get_db)
) -> PagedResultList[Equipment]:
    raise NotImplementedError()

@lab_equipments.post('/')
async def create_equipment(
    equipment: EquipmentPatch
) -> Equipment:
    raise NotImplementedError

@lab_equipments.get('/{equipment_id}')
async def read_equipment(
    equipment_id: UUID,
    db = Depends(get_db)
) -> Equipment:
    return await Equipment.get_for_id(db, equipment_id)

@lab_equipments.put('/{equipment_id}')
async def update_equipment(
    equipment_id: UUID,
    patch: EquipmentPatch,
    db = Depends(get_db)
) -> Equipment:
    raise NotImplementedError

