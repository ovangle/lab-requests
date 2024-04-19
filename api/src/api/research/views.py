from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select
from api.base.schemas import ModelView

from api.lab.lab_resources.schemas import resource_index_cls
from api.lab.lab_resources.views import (
    _register_resource_views,
    register_resource_consumer_views,
)
from api.lab.schemas import lookup_lab
from api.research.schemas import ResearchPlanTaskView
from api.research.schemas.funding import ResearchFundingView, lookup_research_funding
from api.research.schemas.plan import (
    ResearchPlanCreateRequest,
    ResearchPlanUpdateRequest,
)
from api.user.schemas.user import lookup_user

from db import get_db
from db.models.lab import LabResourceType
from db.models.research import ResearchPlan, ResearchPlanTask, ResearchFunding

from .schemas import (
    ResearchFundingIndex,
    ResearchFundingIndexPage,
    ResearchPlanIndexPage,
    ResearchPlanIndex,
    ResearchPlanView,
    ResearchPlanTaskIndex,
)
from .queries import query_research_fundings, query_research_plans

research = APIRouter(prefix="/research", tags=["research"])


@research.get("/funding")
async def index_research_fundings(
    name: Optional[str] = None, page_index: int = 0, db=Depends(get_db)
) -> ResearchFundingIndexPage:
    index = ResearchFundingIndex(query_research_fundings(name_eq=name))
    return await index.load_page(db, page_index)


@research.get("/funding/{funding_id}")
async def get_research_funding(
    funding_id: UUID, db=Depends(get_db)
) -> ResearchFundingView:
    funding = await ResearchFunding.get_for_id(db, funding_id)
    return await ResearchFundingView.from_model(funding)


research_plans = APIRouter(prefix="/plans")


@research_plans.get("")
async def index_plans(
    researcher: Optional[UUID] = None,
    coordinator: Optional[UUID] = None,
    db=Depends(get_db),
) -> ResearchPlanIndexPage:
    plan_index = ResearchPlanIndex(
        query_research_plans(researcher=researcher, coordinator=coordinator)
    )
    return await plan_index.load_page(db, 1)


@research_plans.post("")
async def create_plan(
    request: ResearchPlanCreateRequest, db=Depends(get_db)
) -> ResearchPlanView:
    created = await request.do_create(db)
    await db.commit()
    return await ResearchPlanView.from_model(created)


research_plan_detail = APIRouter(prefix="/{plan_id}")


@research_plan_detail.get("/")
async def get_plan(plan_id: UUID, db=Depends(get_db)) -> ResearchPlanView:
    plan = await ResearchPlan.get_for_id(db, plan_id)
    return await ResearchPlanView.from_model(plan)


@research_plan_detail.put("/")
async def update_plan(
    plan_id: UUID, request: ResearchPlanUpdateRequest, db=Depends(get_db)
) -> ResearchPlanView:
    plan = await ResearchPlan.get_for_id(db, plan_id)
    plan = await request.do_update(plan)
    return await ResearchPlanView.from_model(plan)


@research_plan_detail.get("/tasks")
async def index_plan_tasks(plan_id: UUID, db=Depends(get_db)):
    assert await ResearchPlan.get_for_id(db, plan_id)
    task_index = ResearchPlanTaskIndex(
        select(ResearchPlanTask).where(ResearchPlanTask.plan_id == plan_id)
    )
    return await task_index.load_page(db, 1)


@research_plan_detail.get("/tasks/{index}")
async def get_plan_task(plan_id: UUID, index: int, db=Depends(get_db)):
    task = await ResearchPlanTask.get_for_plan_and_index(db, plan_id, index)
    return await ResearchPlanTaskView.from_model(task)


research_plan_resources = APIRouter(prefix="/resources")
register_resource_consumer_views(research_plan_resources, "plan_id")
research_plan_detail.include_router(research_plan_resources)

research_plans.include_router(research_plan_detail)
research.include_router(research_plans)
