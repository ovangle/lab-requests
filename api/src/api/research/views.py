from uuid import UUID
from typing import Optional, Union
from fastapi import APIRouter, Depends
from api.lab.plan.queries import query_research_plans
from api.research.schemas import ResearchFundingIndex, ResearchFundingIndexPage, ResearchFundingView, ResearchPlanIndexPage

from db import LocalSession, get_db
from db.models.research.funding import ResearchFunding

from .model_queries import query_funding_models

uni_research_funding = APIRouter(
    prefix="/uni/research/funding", tags=["research", "funding"]
)


@uni_research_funding.get("/")
async def index_models(
    name_eq: str | None = None,
    text: str | None = None,
    db: LocalSession = Depends(get_db),
) -> ResearchFundingIndexPage:
    query = query_funding_models(name_eq=name_eq, text=text)
    return await ResearchFundingIndex(query).load_page(db, 0)


@uni_research_funding.get("/{id}")
async def get_funding_model(
    id: UUID, db: LocalSession = Depends(get_db)
):
    model = await ResearchFunding.get_for_id(db, id)
    return await ResearchFundingView.from_model(model)
        
lab_plans = APIRouter(prefix="/experimental-plans", tags=["experimental-plans"])


@lab_plans.get("/")
async def index_plans(
    researcher: str | None = None,
    supervisor: str | None = None,
    technician: str | None = None,
    db=Depends(get_db),
) -> ResearchPlanIndexPage:
    experimental_plans = query_research_plans(
        researcher=researcher,
        supervisor=supervisor,
        technician_email=technician,
    )
    index = ResearchPlanIndex(experimental_plans)
    return await index.load_page(db, 0)
        ExperimentalPlan, db, experimental_plans
    )


@lab_plans.post(
    "/",
)
async def create_plan(
    create_request: ExperimentalPlanCreate, db=Depends(get_db)
) -> ExperimentalPlan:
    return await create_request(db)


@lab_plans.get(
    "/{plan_id}",
)
async def read_plan(plan_id: UUID, db=Depends(get_db)) -> ExperimentalPlan:
    return await ExperimentalPlan.get_for_id(db, plan_id)


@lab_plans.post("/{plan_id}")
async def update_plan(
    plan_id: UUID, patch: ExperimentalPlanPatch, db: LocalSession = Depends(get_db)
):
    db_plan = await db.get(models.ExperimentalPlan_, plan_id)
    if not db_plan:
        raise ExperimentalPlanDoesNotExist.for_id(plan_id)
    plan = await patch(db, db_plan)
    await db.commit()
    return plan


@lab_plans.get("/{plan_id}/tasks/")
async def index_plan_work_units(
    plan_id: UUID, db=Depends(get_db)
) -> :
    return await PagedResultList[WorkUnit].from_selection(
        WorkUnit,
        db,
        query_work_units(plan_id=plan_id),
    )

@lab_plans.get("/{plan_id}/tasks/{work_unit_index}")
async def read_plan_work_unit(
    plan_id: UUID, work_unit_index: int, db=Depends(get_db)
) -> WorkUnit:
    return await WorkUnit.get_for_plan_and_index(db, plan_id, work_unit_index)

@lab_plans.put(
    "/{plan_id}/work-units/{work_unit_index}",
)
async def create_work_unit(
    plan_id: UUID, work_unit: WorkUnitPatch | WorkUnitCreate, db=Depends(get_db)
) -> WorkUnit:
    if isinstance(work_unit, WorkUnitPatch):
        do_create = WorkUnitCreate(plan_id=plan_id, **work_unit.model_dump())
    else:
        if work_unit.plan_id != plan_id:
            raise ValueError("Cannot create work unit for different plan id")
        do_create = work_unit

    return await do_create(db)
