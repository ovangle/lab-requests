from uuid import UUID
from fastapi import APIRouter, Depends

from db import get_db
from db.models.research.plan import ResearchPlan, query_research_plans

from api.schemas.research import (
    ResearchPlanCreateRequest,
    ResearchPlanIndexPage,
    ResearchPlanDetail,
    ResearchPlanUpdateRequest,
)

research = APIRouter(prefix="/research", tags=["research"])



@research.get("/plan")
async def index_plans(
    researcher: UUID | None = None,
    coordinator: UUID | None = None,
    page_index: int = 1,
    db=Depends(get_db),
) -> ResearchPlanIndexPage:
    return await ResearchPlanIndexPage.from_selection(
        db,
        query_research_plans(
            researcher=researcher,
            coordinator=coordinator
        ),
        page_index=page_index
    )



@research.post("/plan")
async def create_plan(
    request: ResearchPlanCreateRequest, db=Depends(get_db)
) -> ResearchPlanDetail:
    created = await request.do_create(db)
    await db.commit()
    return await ResearchPlanDetail.from_model(created)


@research.get("/plan/{plan_id}")
async def get_plan(plan_id: UUID, db=Depends(get_db)) -> ResearchPlanDetail:
    plan = await ResearchPlan.get_for_id(db, plan_id)
    return await ResearchPlanDetail.from_model(plan)


@research.put("/plan/{plan_id}")
async def update_plan(
    plan_id: UUID, request: ResearchPlanUpdateRequest, db=Depends(get_db)
) -> ResearchPlanDetail:
    plan = await ResearchPlan.get_for_id(db, plan_id)
    plan = await request.do_update(plan)
    return await ResearchPlanDetail.from_model(plan)
