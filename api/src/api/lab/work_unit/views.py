
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Form, UploadFile
from api.lab.work_unit.resource.common.schemas import ResourceType

from db import LocalSession, get_db
from api.base.schemas import PagedResultList
from api.lab.plan.schemas import ExperimentalPlan

from .schemas import WorkUnit, WorkUnitCreate, WorkUnitPatch
from .files import get_work_unit_attachments_store

lab_work_units = APIRouter(
    prefix="/lab/work-units",
    tags=["work units"]
)

@lab_work_units.get("/")
async def index_work_units(
    plan_id: UUID | None = None,
    researcher_email: str | None = None,
    supervisor_email: str | None = None,
    technician_email: str | None = None,
    db: LocalSession = Depends(get_db)
) -> PagedResultList[WorkUnit]:
    from .queries import query_work_units 

    query = query_work_units(
        plan_id=plan_id, 
        researcher_email=researcher_email,
        supervisor_email=supervisor_email,
        technician_email=technician_email
    ) 
    return await PagedResultList[WorkUnit].from_selection(WorkUnit, db, query)

@lab_work_units.post("/")
async def create_work_unit(create: WorkUnitCreate, db: LocalSession = Depends(get_db)) -> WorkUnit:
    return await create(db)


@lab_work_units.get(
    "/{work_unit_id}",
)
async def get_work_unit(work_unit_id: UUID, db: LocalSession = Depends(get_db)) -> WorkUnit:
    return await WorkUnit.get_by_id(db, work_unit_id)

@lab_work_units.put(
    "/{work_unit_id}"
)
async def put_work_unit(work_unit_id: UUID, patch: WorkUnitPatch, db: LocalSession = Depends(get_db)) -> WorkUnit:
    work_unit = await WorkUnit.get_by_id(db, work_unit_id)
    return await patch(db, work_unit)

@lab_work_units.post(
    "/{work_unit_id}/files"
)
async def upload_work_unit_attachment(
    work_unit_id: UUID,
    file: UploadFile, 
    resource_type: Annotated[ResourceType, Form()],
    resource_index: Annotated[ResourceType, Form()],
    db: LocalSession = Depends(get_db),
    file_store = Depends(get_work_unit_attachments_store)
):
    work_unit = await WorkUnit.get_by_id(db, work_unit_id)
    return {
        "filename": file.filename,
        "content_type": file.content_type
    }