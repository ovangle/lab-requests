from typing import Optional, cast
from uuid import UUID
from fastapi import APIRouter, Depends

from sqlalchemy import select
from api.lab.lab_equipment.queries import query_equipments

from db import LocalSession, get_db
from db.models.lab import LabEquipment
from db.models.lab.lab_equipment import LabEquipmentProvision

from .schemas import (
    LabEquipmentCreateRequest,
    LabEquipmentIndex,
    LabEquipmentIndexPage,
    LabEquipmentLookup,
    LabEquipmentProvisionRequest,
    LabEquipmentProvisionView,
    LabEquipmentProvisionPage,
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


lab_equipments = APIRouter(prefix="/equipment", tags=["lab-equipments"])


@lab_equipments.get("/")
async def index_equipments(
    name_startswith: Optional[str] = None,
    name: Optional[str] = None,
    has_tags: set[str] | str | None = None,
    page_index: int = 0,
    lab: UUID | None = None,
    db=Depends(get_db),
) -> LabEquipmentIndexPage:
    equipment_index = LabEquipmentIndex(
        query_equipments(
            lab=lab, name_istartswith=name_startswith, name_eq=name, has_tags=has_tags
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


@lab_equipments.get("/provision")
async def index_equipment_provisions(
    db=Depends(get_db),
) -> LabEquipmentProvisionPage:
    raise NotImplementedError


@lab_equipments.post("/provision")
async def request_equipment_provision(
    request: LabEquipmentProvisionRequest, db=Depends(get_db)
) -> LabEquipmentProvisionView:
    raise NotImplemented


@lab_equipments.get("/provision/{provisioin_id}")
async def get_equipment_provisioning(
    provision_id: UUID, db=Depends(get_db)
) -> LabEquipmentProvisionView:
    provision = await LabEquipmentProvision.get_for_id(db, provision_id)
    return await LabEquipmentProvisionView.from_model(provision)


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
