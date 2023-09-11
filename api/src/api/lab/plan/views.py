import dataclasses
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from api.base.schemas import PagedResultList

from api.utils.db import LocalSession, get_db

from . import models
from .schemas import (
    ExperimentalPlan,
    ExperimentalPlanCreate,
    ExperimentalPlanPatch,
    WorkUnit,
    WorkUnitCreate,
    WorkUnitPatch
)

lab_plans = APIRouter(
    prefix="/lab/experimental-plans",
    tags=["experimental-plans"]
)

@lab_plans.get("/")
async def list_plans(researcher: str | None = None, db=Depends(get_db)) -> list[ExperimentalPlan]:
    if researcher:
        return await ExperimentalPlan.list_for_researcher(db, researcher)
    return await ExperimentalPlan.all(db)

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
    plan = await db.get(models.ExperimentalPlan, plan_id)
    plan = await patch(db, plan);
    await db.commit()
    return plan

@lab_plans.get(
    "/{plan_id}/work_units/"
)
async def list_plan_work_units(
    plan_id: UUID, 
    db = Depends(get_db)
) -> list[WorkUnit]:
    return await WorkUnit.list_for_experimental_plan(db, plan_id)

@lab_plans.get(
    "/{plan_id}/work_units/{work_unit_index}"
)
async def read_plan_work_unit(plan_id: UUID, work_unit_index: int, db = Depends(get_db)) -> WorkUnit:
    return await WorkUnit.get_by_plan_and_index(db, plan_id, work_unit_index)

@lab_plans.post(
    "/{plan_id}/work_units/{index}",
)
async def create_work_unit(plan_id: UUID, work_unit: WorkUnitPatch | WorkUnitCreate, db = Depends(get_db)) -> WorkUnit:
    if isinstance(work_unit, WorkUnitPatch):
        do_create = WorkUnitCreate(plan_id=plan_id, **dataclasses.asdict(work_unit))
    else: 
        if work_unit.plan_id != plan_id:
            raise ValueError('Cannot create work unit for different plan id')
        do_create = work_unit

    return await do_create(db)

@lab_plans.get("/work_units")
async def list_work_units(
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
    model_results = await db.scalars(query)
    model_count = await db.scalar(func.count(WorkUnit.id).select_from(query))

    return PagedResultList[WorkUnit](
        items=[WorkUnit.from_model(m) for m in model_results],
        total_item_count=model_count or 0,
        page_index=0
    )
 

@lab_plans.get(
    "/work_units/{work_unit_id}",
)
async def get_work_unit(work_unit_id: UUID, db = Depends(get_db)) -> WorkUnit:
    return await WorkUnit.get_by_id(db, work_unit_id)

