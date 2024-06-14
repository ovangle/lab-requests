from typing import Optional, cast
from uuid import UUID
from fastapi import APIRouter, Depends

from sqlalchemy import select
from api.equipment.queries import query_equipments

from db import LocalSession, get_db
from db.models.lab import LabEquipment
from db.models.lab.lab_equipment import LabEquipmentProvision

from ...equipment.schemas import (
    CreateEquipmentProvisionRequest,
    LabEquipmentCreateRequest,
    LabEquipmentIndex,
    LabEquipmentIndexPage,
    LabEquipmentProvisionView,
    LabEquipmentUpdateRequest,
    LabEquipmentView,
)


lab_equipment_tags = APIRouter(
    prefix="/equipments/tags", tags=["lab-equipment", "lab-equipment-tags"]
)


# @lab_equipment_tags.get("/")
# async def index_equipment_tags(
#     name_startswith: Optional[str] = None, db=Depends(get_db)
# ) -> :
#     return await PagedResultList[EquipmentTag].from_selection(
#         cast(type, EquipmentTag),
#         db,
#         query_equipment_tags(name_istartswith=name_startswith),
#     )


# EQuipments that are specific to a given lab
lab_equipments = APIRouter(prefix="/equipment", tags=["lab-equipments"])


@lab_equipments.get("/")
async def index_equipments(
    lab_id: UUID,
    name_startswith: Optional[str] = None,
    name: Optional[str] = None,
    has_tags: set[str] | str | None = None,
    page: int = 0,
    db=Depends(get_db),
) -> LabEquipmentIndexPage:
    equipment_index = LabEquipmentIndex(
        query_equipments(
            lab=lab_id,
            name_istartswith=name_startswith,
            name_eq=name,
            has_tags=has_tags,
        )
    )
    return await equipment_index.load_page(db, page)


@lab_equipments.get("/{equipment_id}")
async def read_equipment(equipment_id: UUID, db=Depends(get_db)) -> LabEquipmentView:
    equipment = await LabEquipment.get_for_id(db, equipment_id)
    return await LabEquipmentView.from_model(equipment)


@lab_equipments.put("/{equipment_id}")
async def update_equipment(
    equipment_id: UUID, update_req: LabEquipmentUpdateRequest, db=Depends(get_db)
) -> LabEquipmentView:
    equipment = await LabEquipment.get_for_id(db, equipment_id)
    await update_req.do_update(equipment)
    await db.commit()
    return await LabEquipmentView.from_model(equipment)


@lab_equipments.get("/{equipment_id}/provisions")
async def index_equipment_provisions(equipment_id: UUID):
    raise NotImplementedError


@lab_equipments.post("/{equipment_id}/provisions")
async def create_equipment_provision(
    equipment_id: UUID, request: CreateEquipmentProvisionRequest, db=Depends(get_db)
) -> LabEquipmentProvisionView:
    equipment = await LabEquipment.get_for_id(db, equipment_id)
    provision = await request.do_create(db, equipment=equipment)
    return await LabEquipmentProvisionView.from_model(provision, equipment=equipment)
