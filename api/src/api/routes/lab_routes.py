from uuid import UUID
from fastapi import APIRouter, Depends

from api.auth.context import get_current_authenticated_user
from api.schemas.lab.lab_provision import LabProvisionDetail, LabProvisionIndexPage, LabProvisionRequest
from db import get_db
from db.models.lab.lab import Lab, query_labs
from db.models.lab.provisionable.lab_provision import LabProvision, query_lab_provisions
from db.models.uni.campus import Campus
from db.models.uni.discipline import Discipline

from api.schemas.lab import LabIndexPage, LabDetail
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

    return await LabIndexPage.from_selection(
        db,
        query_labs(campus=campus_model, discipline=discipline, search=search, id_in=id_in),
        page_index=1
    )


@labs.get("/lab/{lab_id}")
async def lab_detail(lab_id: UUID, db=Depends(get_db)) -> LabDetail:
    lab = await Lab.get_for_id(db, lab_id)
    return await LabDetail.from_model(lab)


@labs.get("/provision")
async def index_lab_provisions(
    type: str | None = None,
    provisionable: UUID | None = None,
    action: str | None = None,
    only_pending: bool = False,
    db=Depends(get_db)
):
    return await LabProvisionIndexPage.from_selection(
        db,
        query_lab_provisions(
            provisionable_type=type,
            provisionable_id=provisionable,
            action=action,
            only_pending=only_pending
        )
    )

@labs.get("/provision/{provision_id}")
async def read_lab_provision(provision_id: UUID, db=Depends(get_db)):
    provision = await LabProvision.get_by_id(db, provision_id)
    return await LabProvisionDetail.from_model(provision)

@labs.put("/provision/{provision_id}")
async def update_lab_provision(
    provision_id: UUID,
    request: LabProvisionRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_authenticated_user)
):
    provision = await LabProvision.get_by_id(db, provision_id)
    provision = await request.do_update(provision, current_user=current_user)
    return LabProvisionDetail.from_model(provision)
