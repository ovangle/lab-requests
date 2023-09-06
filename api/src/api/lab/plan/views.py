from uuid import UUID

from fastapi import APIRouter, Depends

from api.utils.db import Session, get_db

from .schemas import (
    ExperimentalPlan,
    ExperimentalPlanCreate,
    WorkUnit,
    WorkUnitPatch
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
async def read_plan(plan_id: UUID, db = Depends(Session)) -> ExperimentalPlan:
    return await ExperimentalPlan.get_by_id(db, plan_id)


@plans.get(
    "/{plan_id}/work_units/"
)
async def list_plan_work_units(
    plan_id: UUID, 
    db = Depends(Session)
) -> list[WorkUnit]:
    return await WorkUnit.list_for_experimental_plan(db, plan_id)

@plans.get(
    "/{plan_id}/work_units/{work_unit_index}"
)
async def read_plan_work_unit(plan_id: UUID, work_unit_index: int, db = Depends(get_db)) -> WorkUnit:
    return await WorkUnit.get_by_plan_and_index(plan_id, work_unit_index)


@plans.get(
    "/work_units/{work_unit_id}",
)
async def get_work_unit(work_unit_id: UUID) -> WorkUnit:

    return await WorkUnit.get_work_unit_by_id(work_unit_id)

@plans.post(
    "/{plan_id}/work_units/{index}",
)
async def create_work_unit(plan_id: UUID, work_unit: WorkUnitCreate) -> WorkUnit:
    plan = await ExperimentalPlan.get_plan_by_id(plan_id)
    work_unit = await create_work_unit(work_unit)
