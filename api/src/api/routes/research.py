from uuid import UUID
from fastapi import APIRouter, Depends

from api.schemas.research.plan import (
    ResearchPlanCreateRequest,
    ResearchPlanIndex,
    ResearchPlanIndexPage,
    ResearchPlanDetail,
    ResearchPlanUpdateRequest,
)
from db import get_db
from db.models.research.funding import ResearchFunding, query_research_fundings

from api.schemas.research.funding import (
    ResearchFundingIndex,
    ResearchFundingIndexPage,
    ResearchFundingDetail,
)
from db.models.research.plan import ResearchPlan, query_research_plans

research = APIRouter(prefix="/research", tags=["research"])


@research.get("/funding")
async def index_research_fundings(
    name: str | None = None, page_index: int = 0, db=Depends(get_db)
) -> ResearchFundingIndexPage:
    index = ResearchFundingIndex(name_eq=name, page_index=page_index, text="")
    return await index.load_page(db)


@research.get("/funding/{funding_id}")
async def get_research_funding(
    funding_id: UUID, db=Depends(get_db)
) -> ResearchFundingDetail:
    funding = await ResearchFunding.get_for_id(db, funding_id)
    return await ResearchFundingDetail.from_model(funding)


@research.get("/plan")
async def index_plans(
    researcher: UUID | None = None,
    coordinator: UUID | None = None,
    db=Depends(get_db),
) -> ResearchPlanIndexPage:
    plan_index = ResearchPlanIndex(researcher=researcher, coordinator=coordinator)
    return await plan_index.load_page(db)


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
