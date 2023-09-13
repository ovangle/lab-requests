import dataclasses
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func

from db import LocalSession, get_db
from api.base.schemas import PagedResultList
from api.lab.work_unit.schemas import WorkUnit, WorkUnitPatch, WorkUnitCreate

from . import models
from .queries import query_experimental_plans
from .schemas import (
    ExperimentalPlan,
    ExperimentalPlanCreate,
    ExperimentalPlanPatch,
)

lab_plans = APIRouter(
    prefix="/lab/experimental-plans",
    tags=["experimental-plans"]
)

@lab_plans.get("/")
async def index_plans(
    researcher: str | None = None, 
    supervisor: str | None = None,
    technician: str | None = None,
    db=Depends(get_db)
) -> PagedResultList[ExperimentalPlan]:
    experimental_plans = query_experimental_plans(
        researcher_email=researcher,
        supervisor_email=supervisor,
        technician_email=technician
    )
    return await PagedResultList[ExperimentalPlan].from_selection(ExperimentalPlan, db, experimental_plans)

@lab_plans.post(
    "/",
)
async def create_plan(create_request: ExperimentalPlanCreate, db=Depends(get_db)) -> ExperimentalPlan:
    return await create_request(db)


@lab_plans.get(
    "/{plan_id}",
)
async def read_plan(plan_id: UUID, db = Depends(get_db)) -> ExperimentalPlan:
    return await ExperimentalPlan.get_by_id(db, plan_id)

@lab_plans.post(
    "/{plan_id}"
)
async def update_plan(plan_id: UUID, patch: ExperimentalPlanPatch, db: LocalSession = Depends(get_db)):
    plan = await db.get(models.ExperimentalPlan_, plan_id)
    plan = await patch(db, plan);
    await db.commit()
    return plan

@lab_plans.get(
    "/{plan_id}/work-units/"
)
async def index_plan_work_units(
    plan_id: UUID, 
    db = Depends(get_db)
) -> PagedResultList[WorkUnit]:
    work_units = await WorkUnit.list_for_experimental_plan(db, plan_id)
    return PagedResultList.from_list(work_units)

@lab_plans.get(
    "/{plan_id}/work-units/{work_unit_index}"
)
async def read_plan_work_unit(plan_id: UUID, work_unit_index: int, db = Depends(get_db)) -> WorkUnit:
    return await WorkUnit.get_by_plan_and_index(db, plan_id, work_unit_index)

@lab_plans.post(
    "/{plan_id}/work-units/create"
)
async def create_plan_work_unit(plan_id: UUID, work_unit: WorkUnitPatch, db = Depends(get_db)) -> WorkUnit:
    create_req = WorkUnitCreate(plan_id=plan_id, **work_unit.model_dump())
    return await create_req(db)


@lab_plans.put(
    "/{plan_id}/work-units/{work_unit_index}",
)
async def create_work_unit(plan_id: UUID, work_unit: WorkUnitPatch | WorkUnitCreate, db = Depends(get_db)) -> WorkUnit:
    if isinstance(work_unit, WorkUnitPatch):
        do_create = WorkUnitCreate(plan_id=plan_id, **work_unit.model_dump())
    else: 
        if work_unit.plan_id != plan_id:
            raise ValueError('Cannot create work unit for different plan id')
        do_create = work_unit

    return await do_create(db)

