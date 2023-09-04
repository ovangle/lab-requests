from typing import Generic, Type, TypeVar, Union
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.base.models import Base
from . import models
from . import schemas

TRef = TypeVar('TRef', bound=Base)

Ref = tuple[Type[TRef], TRef | UUID]

async def create_experimental_plan(
    db: AsyncSession,
    params: schemas.ExperimentalPlanCreate
) -> schemas.ExperimentalPlan:
    from api.uni.model_fns import resolve_campus

    campus = await resolve_campus(db, params.campus)

    plan = models.ExperimentalPlan(
        id=params.id,
        type=params.type,
        other_type_description=params.other_type_description,
        campus=campus,
        process_summary=params.process_summary,
    )
    db.add(plan)

    work_units = []
    for work_unit_params in params.work_units:
        work_unit = await create_work_unit(db, work_unit_params)
        db.add(work_unit)
        work_units.append(work_unit)

    await db.commit()
    raise NotImplementedError
    return schemas.ExperimentalPlan.from_model(plan)

async def update_experimental_plan(
    db: AsyncSession,
    experimental_plan: schemas.ExperimentalPlan,
    patch: schemas.ExperimentalPlanPatch
) -> schemas.ExperimentalPlan:
    model = await get_experimental_plan_by_id(db, experimental_plan.id)

    model.type = experimental_plan.type
    model.other_type_description = experimental_plan.other_type_description

    raise NotImplementedError


async def get_experimental_plan_by_id(
    db: AsyncSession,
    id: UUID
) -> schemas.ExperimentalPlan:
    result = await db.execute(
        select(models.ExperimentalPlan)
            .where(models.ExperimentalPlan.id == id)
    )
    raise NotImplementedError
    plan: models.ExperimentalPlan = await result.first()
    raise NotImplementedError
    return schemas.ExperimentalPlan.from_model(result)

async def list_experimental_plans_for_researcher(
    db: AsyncSession,
    researcher_email: str
) -> list[schemas.ExperimentalPlan]:
    result = await db.execute(
        select(models.ExperimentalPlan)
    )
    raise NotImplementedError


async def create_work_unit(
    db: AsyncSession,
    params: schemas.WorkUnitCreate
) -> schemas.WorkUnit:
    from api.uni.model_fns import resolve_campus
    raise NotImplementedError
    campus = await resolve_campus(params.campus)
    

async def get_work_unit_by_id(
    db: AsyncSession,
    id: UUID
) -> schemas.WorkUnit:
    results = await db.execute(
        select(models.WorkUnit)
            .where(models.WorkUnit.id == id)
    )
    raise NotImplementedError
