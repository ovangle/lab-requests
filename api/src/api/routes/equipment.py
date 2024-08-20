from uuid import UUID
from fastapi import APIRouter, Depends

from api.schemas.equipment.equipment import (
    EquipmentCreateRequest,
    EquipmentDetail,
    EquipmentIndex,
)
from api.schemas.equipment.equipment_installation import EquipmentInstallationDetail
from db import get_db
from db.models.equipment.equipment import Equipment, query_equipments
from db.models.equipment.equipment_installation import EquipmentInstallation


equipments = APIRouter(prefix="/equipments")


@equipments.get("/equipment")
async def index_equipments(
    lab_id: UUID | None = None,
    name_startswith: str | None = None,
    name: str | None = None,
    tags: str | None = None,
    page: int = 0,
    db=Depends(get_db),
):
    tags_ = set(tags or "".split(","))

    equipment_index = EquipmentIndex(
        lab_id=lab_id,
        page_index=page,
        name_istartswith=name_startswith,
        name_eq=name,
        has_tags=tags_,
    )

    return await equipment_index.load_page(db)


@equipments.post("/equipment")
async def create_equipment(create_req: EquipmentCreateRequest, db=Depends(get_db)):
    model = await create_req.do_create(db)
    return await EquipmentDetail.from_model(model)


@equipments.get("/equipment/{equipment_id}")
async def read_equipment(equipment_id: UUID, db=Depends(get_db)) -> EquipmentDetail:
    equipment = await Equipment.get_for_id(db, equipment_id)
    return await EquipmentDetail.from_model(equipment)


@equipments.get("/installation")
async def index_equipment_installations():
    raise NotImplementedError


@equipments.get("/installation/{installation_id}")
async def read_equipment_installation(
    installation_id: UUID, db=Depends(get_db)
) -> EquipmentInstallationDetail:
    equipment_installation = await EquipmentInstallation.get_by_id(db, installation_id)
    return await EquipmentInstallationDetail.from_model(equipment_installation)
