from typing import Optional, cast
from uuid import UUID
from fastapi import APIRouter, Depends

from sqlalchemy import select
from api.lab.lab_equipment.queries import query_equipments

from db import LocalSession, get_db
from db.models.lab import LabEquipment

from .schemas import (
    LabEquipmentCreateRequest,
    LabEquipmentIndex,
    LabEquipmentIndexPage,
    LabEquipmentLookup,
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


lab_equipments = APIRouter(prefix="/equipments", tags=["lab-equipments"])


@lab_equipments.get("/")
async def index_equipments(
    name_startswith: Optional[str] = None,
    name: Optional[str] = None,
    has_tags: set[str] | str | None = None,
    page_index: int = 0,
    db=Depends(get_db),
) -> LabEquipmentIndexPage:
    equipment_index = LabEquipmentIndex(
        query_equipments(
            name_istartswith=name_startswith, name_eq=name, has_tags=has_tags
        )
    )
    return await equipment_index.load_page(db, page_index)


@lab_equipments.post("/")
async def create_equipment(
    create_req: LabEquipmentCreateRequest, db: LocalSession = Depends(get_db)
) -> LabEquipmentView:
    model = await create_req.do_create(db)
    await db.commit()
    return await LabEquipmentView.from_model(model)


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
