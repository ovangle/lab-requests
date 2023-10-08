
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, UploadFile
from api.lab.work_unit.resource.common.schemas import ResourceFileAttachment, ResourceType
from api.lab.work_unit.resource.errors import ResourceDoesNotExist

from db import LocalSession, get_db
from api.base.schemas import PagedResultList
from api.lab.plan.schemas import ExperimentalPlan

from .resource.schemas import Resource
from .schemas import WorkUnit, WorkUnitCreate, WorkUnitPatch
from .files import upload_resource_attachment

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
    return await WorkUnit.get_for_id(db, work_unit_id)

@lab_work_units.put(
    "/{work_unit_id}"
)
async def put_work_unit(work_unit_id: UUID, patch: WorkUnitPatch, db: LocalSession = Depends(get_db)) -> WorkUnit:
    work_unit = await WorkUnit.get_for_id(db, work_unit_id)
    return await patch(db, work_unit)

@lab_work_units.post(
    "/{work_unit_id}/files/{resource_type}/{resource_id}"
)
async def add_resource_attachment(
    work_unit_id: UUID,
    file: UploadFile, 
    params: Annotated[bytes, File()],
    db: LocalSession = Depends(get_db),
) -> ResourceFileAttachment:
    work_unit = await WorkUnit.get_for_id(db, work_unit_id)
    raise NotImplementedError
    # resource: Resource = work_unit.get_resource(resource_type, resource_id)
    # return await upload_resource_attachment(db, resource, file)
