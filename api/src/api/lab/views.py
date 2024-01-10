from uuid import UUID
from fastapi import APIRouter, Depends

from db import get_db

from .equipment.views import lab_equipments, lab_equipment_tags
from .work_unit.views import lab_work_units

from .schemas import Lab

lab = APIRouter(prefix="/lab", tags=["labs"])

lab.include_router(lab_equipments)
lab.include_router(lab_equipment_tags)
lab.include_router(lab_work_units)


@lab.get("/{lab_id}")
async def read_lab(lab_id: UUID, db=Depends(get_db)):
    return await Lab.get_for_id(db, lab_id)
