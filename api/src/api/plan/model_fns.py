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
    from api.uni.model_fns import get_campus

    campus = await get_campus(db, params.campus)

    plan = models.ExperimentalPlan(
        id=params.id,
        funding_type=params.funding_type,
        campus=campus,
        researcher_email= params.researcher_email,
        supervisor_email=params.supervisor_email,
        process_summary=params.process_summary,
    )
    db.add(plan)

    work_units = []
    for work_unit_params in params.work_units:
        work_unit = await create_work_unit(db, work_unit_params)
        db.add(work_unit)
        work_units.append(work_unit)

    await db.commit()
    return schemas.ExperimentalPlan.from_model(plan)

async def update_experimental_plan(
    db: AsyncSession,
    experimental_plan: schemas.ExperimentalPlan,
    patch: schemas.ExperimentalPlanPatch
) -> schemas.ExperimentalPlan:
    model = await models.ExperimentalPlan.get_by_id(db, experimental_plan.id)

    model.funding_type = patch.funding_type
    model.process_summary = patch.process_summary
    model.researcher_email = patch.researcher_email
    model.supervisor_email = patch.supervisor_email

    db.add(model)
    await db.commit()
    return schemas.ExperimentalPlan.from_model(model)


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
    model_results = await models.ExperimentalPlan.list_for_researcher(db, researcher_email)

    return [
        schemas.ExperimentalPlan.from_model(m)
        for m in model_results
    ]

async def list_experimental_plans_for_supervisor(
    db: AsyncSession,
    supervisor_email: str
) -> list[schemas.ExperimentalPlan]:
    model_results = await models.ExperimentalPlan.list_for_supervisor(db, supervisor_email)
    return [
        schemas.ExperimentalPlan.from_model(m)
        for m in model_results
    ]


async def create_work_unit(
    db: AsyncSession,
    params: schemas.WorkUnitCreate
) -> schemas.WorkUnit:
    raise NotImplementedError
    campus = await resolve_campus(params.campus)
    

async def get_work_unit_by_id(
    db: AsyncSession,
    id: UUID
) -> schemas.WorkUnit:
    model = await models.WorkUnit.get_by_id(db, id)
    return schemas.WorkUnit.from_model(model)

async def list_work_units_for_plan(
    db: AsyncSession,
    plan_id: UUID,
):
    model_results = await models.WorkUnit.list_for_plan(db, plan_id)
    return [schemas.WorkUnit.from_model(m) for m in model_results]


async def get_work_units_for_technician(
    db: AsyncSession,
    technician_email: str
):
    model_results = await models.WorkUnit.list_by_technician(db, technician_email)
    return [
        schemas.WorkUnit.from_model(m)
        for m in model_results
    ]