from uuid import UUID

from fastapi import APIRouter, Depends

from api.equipment.queries import query_equipments
from db import get_db

from db.models.equipment import Equipment

from api.schemas.equipment import (
    EquipmentCreateRequest,
    EquipmentIndex,
    EquipmentView,
)

equipments = APIRouter(prefix="/equipment")


@equipments.get("/")
async def index_equipments(
    lab_id: UUID | None = None,
    name_startswith: str | None = None,
    name: str | None = None,
    tags: set[str] | str | None = None,
    page: int = 0,
    db=Depends(get_db),
):
    equipment_index = EquipmentIndex(
        query_equipments(
            lab=lab_id, name_istartswith=name_startswith, name_eq=name, has_tags=tags
        )
    )
    return await equipment_index.load_page(db, page)


@equipments.post("/")
async def create_equipment(create_req: EquipmentCreateRequest, db=Depends(get_db)):
    model = await create_req.do_create(db)
    return await EquipmentView.from_model(model)


@equipments.get("/{equipment_id}")
async def read_equipment(equipment_id: UUID, db=Depends(get_db)) -> EquipmentView:
    equipment = await Equipment.get_for_id(db, equipment_id)
    return await EquipmentView.from_model(equipment)
