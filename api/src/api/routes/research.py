from uuid import UUID
from fastapi import APIRouter, Depends

from api.schemas.base import ModelIndexPage
from api.schemas.research.plan import (
    ResearchPlanCreateRequest,
    ResearchPlanIndexPage,
    ResearchPlanDetail,
    ResearchPlanUpdateRequest,
)
from db import get_db
from db.models.research.funding import ResearchFunding, query_research_fundings

from api.schemas.research.funding import (
    ResearchBudgetDetail,
    ResearchBudgetIndexPage,
    ResearchFundingIndexPage,
    ResearchFundingDetail,
)
from db.models.research.funding.research_budget import ResearchBudget, query_research_budgets
from db.models.research.plan import ResearchPlan, query_research_plans

research = APIRouter(prefix="/research", tags=["research"])


@research.get("/funding")
async def index_research_fundings(
    name: str | None = None, page_index: int = 1, db=Depends(get_db)
) -> ResearchFundingIndexPage:
    selection = query_research_fundings(
        name_eq=name,
        text=''
    )
    return await ResearchFundingIndexPage.from_selection(
        db,
        selection,
        page_index=page_index
    )

@research.get("/funding/{funding_id}")
async def get_research_funding(
    funding_id: UUID, db=Depends(get_db)
) -> ResearchFundingDetail:
    funding = await ResearchFunding.get_for_id(db, funding_id)
    return await ResearchFundingDetail.from_model(funding)

@research.get("/budget")
async def index_budgets(
    funding: UUID | None = None,
    funding_name: str | None = None,
    lab: UUID | None = None,
    research_plan: UUID | None = None,
    page_index: int = 1,
    db = Depends(get_db)
) -> ResearchBudgetIndexPage:
    if funding:
        funding_ = funding
    elif funding_name:
        funding_ = query_research_fundings(name_eq=funding_name)
    else:
        funding = None

    selection = query_research_budgets(
        funding = funding_,
        lab=lab,
        research_plan=research_plan,
    )

    return await ResearchBudgetIndexPage.from_selection(
        db,
        selection,
        page_index=page_index
    )



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
