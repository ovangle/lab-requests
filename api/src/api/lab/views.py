from uuid import UUID
from fastapi import APIRouter, Depends
from api.lab.queries import query_labs
from api.uni.schemas import CampusLookup, lookup_campus

from db import get_db
from db.models.uni import Campus
from db.models.lab import Lab
from db.models.uni.discipline import Discipline

from .lab_resources.views import lab_resources
from .lab_equipment.views import lab_equipments, lab_equipment_tags
from .work_unit.views import lab_work_units

from .schemas import LabIndex, LabIndexPage, LabView

labs = APIRouter(prefix="/labs", tags=["labs"])

labs.include_router(lab_equipments)
labs.include_router(lab_equipment_tags)
labs.include_router(lab_work_units)
labs.include_router(lab_resources)


@labs.get("/lab")
async def index_labs(
    search: str | None = None,
    campus: UUID | None = None,
    campus_id: UUID | None = None,
    campus_code: str | None = None,
    discipline: Discipline | None = None,
    ids: str | None = None,
    page_index: int = 0,
    db=Depends(get_db),
) -> LabIndexPage:
    campus_lookup: CampusLookup | UUID | None = None
    if campus_code or campus_id:
        campus_lookup = CampusLookup(id=campus_id, code=campus_code)
    elif campus_lookup:
        campus_lookup = campus

    campus_model: Campus | None = None
    if campus_lookup:
        campus_model = await lookup_campus(db, campus_lookup)

    if ids:
        id_in = [UUID(hex=v) for v in ids.split(",")]
    else:
        id_in = []

    labs = query_labs(
        campus=campus_model,
        discipline=discipline,
        search=search,
        id_in=id_in,
    )
    campus_index = LabIndex(labs)
    return await campus_index.load_page(db, page_index=page_index)


@labs.get("/lab/{lab_id}")
async def read_lab(lab_id: UUID, db=Depends(get_db)) -> LabView:
    lab = await Lab.get_for_id(db, lab_id)
    return await LabView.from_model(lab)
