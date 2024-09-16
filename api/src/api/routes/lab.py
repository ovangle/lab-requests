from uuid import UUID
from fastapi import APIRouter, Depends

from db import get_db
from db.models.lab.lab import Lab, query_labs
from db.models.uni.campus import Campus
from db.models.uni.discipline import Discipline

from api.schemas.lab import LabIndex, LabIndexPage, LabDetail
from api.schemas.uni.campus import CampusLookup, lookup_campus
from api.schemas.lab import LabDetail

labs = APIRouter(prefix="/labs", tags=["labs"])


@labs.get("/lab")
async def index_labs(
    search: str | None = None,
    campus: UUID | None = None,
    campus_id: UUID | None = None,
    campus_code: str | None = None,
    discipline: Discipline | None = None,
    ids: str | None = None,
    page: int = 1,
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

    labs = LabIndex(campus=campus_model, discipline=discipline, search=search, id_in=id_in, page_index=page)
    return await labs.load_page(db)


@labs.get("/lab/{lab_id}")
async def lab_detail(lab_id: UUID, db=Depends(get_db)) -> LabDetail:
    lab = await Lab.get_for_id(db, lab_id)
    return await LabDetail.from_model(lab)
