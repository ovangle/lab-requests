from uuid import UUID

from fastapi import APIRouter, Depends

from api.utils.db import Session

from .schemas import (
    ExperimentalPlan,
    ExperimentalPlanCreate,
    WorkUnit,
    WorkUnitCreate
)
from .model_fns import (
    get_experimental_plan_by_id
)

plans = APIRouter()

@plans.get("/")
async def list_plans() -> list[ExperimentalPlan]:
    raise NotImplementedError()

@plans.post(
    "/",
)
async def create_plan(plan: ExperimentalPlanCreate) -> ExperimentalPlan:
    raise NotImplementedError()

@plans.get(
    "/{plan_id}",
)
async def get_plan(plan_id: UUID, db = Depends(Session)) -> ExperimentalPlan:
    return await get_experimental_plan_by_id(db, plan_id)


@plans.get(
    "/{plan_id}/work_units/"
)
async def list_plan_work_units(
    plan_id: UUID, 
    db = Depends(Session)
) -> list[WorkUnit]:
    return await list_plan_work_units(db, plan_id)

@plans.post(
    "/{plan_id}/work_units/{index}",
)
async def create_work_unit(plan_id: UUID, work_unit: WorkUnitCreate) -> WorkUnit:
    raise NotImplementedError
    plan = await ExperimentalPlan.get_plan_by_id(plan_id)
    work_unit = await create_work_unit(work_unit)

@plans.get(
    "/work_units/{work_unit_id}",
)
async def get_work_unit(work_unit_id: UUID) -> WorkUnit:
    raise NotImplementedError
    return await WorkUnit.get_work_unit_by_id(work_unit_id)
