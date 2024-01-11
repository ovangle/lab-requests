from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select
from api.base.schemas import ModelView
from api.lab.lab_resource_consumer import (
    resource_type_index_cls,
    resource_type_view_cls,
)
from api.research.schemas import ResearchPlanTaskView

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

research = APIRouter(prefix="/research", tags=["research"])


@research.get("/funding")
async def index_research_fundings(
    page_index: int = 0, db=Depends(get_db)
) -> ResearchFundingIndexPage:
    index = ResearchFundingIndex(select(ResearchFunding))
    return await index.load_page(db, page_index)


@research.get("/plans")
async def index_plans(db=Depends(get_db)) -> ResearchPlanIndexPage:
    plan_index = ResearchPlanIndex(select(ResearchPlan))
    return await plan_index.load_page(db, 0)


@research.get("/{plan_id}")
async def get_plan(plan_id: UUID, db=Depends(get_db)) -> ResearchPlanView:
    plan = await ResearchPlan.get_for_id(db, plan_id)
    return await ResearchPlanView.from_model(plan)


@research.get("/{plan_id}/tasks")
async def index_plan_tasks(plan_id: UUID, db=Depends(get_db)):
    assert await ResearchPlan.get_for_id(db, plan_id)
    task_index = ResearchPlanTaskIndex(
        select(ResearchPlan.tasks).where(ResearchPlanTask.plan_id == plan_id)
    )
    return await task_index.load_page(db, 0)


@research.get("/{plan_id}/tasks/{index}")
async def get_plan_task(plan_id: UUID, index: int, db=Depends(get_db)):
    task = await ResearchPlanTask.get_for_plan_and_index(db, plan_id, index)
    return await ResearchPlanTaskView.from_model(task)


@research.get("/{plan_id}/requirements/{resource_type}")
async def index_plan_requirements(
    plan_id: UUID, resource_type: LabResourceType, db=Depends(get_db)
):
    task = await ResearchPlan.get_for_id(db, plan_id)
    resource_index_t = resource_type_index_cls(resource_type)
    plan_index = resource_index_t(task.select_resources(resource_type))

    return await plan_index.load_page(db, 0)


@research.get("/{plan_id}/requirements/{resource_type}/{resource_id}")
async def get_plan_requirement(
    plan_id: UUID, resource_type: LabResourceType, resource_id: UUID, db=Depends(get_db)
):
    plan = await ResearchPlan.get_for_id(db, plan_id)

    resource_view_t = resource_type_view_cls(resource_type)
    resource = await plan.get_resource_for_id(resource_type, resource_id)
    return await resource_view_t.from_model(resource)
