from uuid import UUID
from fastapi import APIRouter, Depends

from api.schemas.uni import (
    CampusDetail,
    CampusIndexPage,
    lookup_campus,
    FundingIndexPage,
    FundingDetail,
)
from api.schemas.uni.funding_schemas import BudgetIndexPage
from db import get_db
from db.models.uni.funding import query_budgets, Funding, query_fundings
from db.models.uni.campus import query_campuses


uni = APIRouter(prefix="/uni")

@uni.get("/campus")
async def index_campuses(
    code_eq: str | None = None,
    text_like: str | None = None,
    page_index: int = 1,
    db=Depends(get_db),
) -> CampusIndexPage:

    selection = query_campuses(
        code_eq=code_eq,
        search=text_like
    )

    return await CampusIndexPage.from_selection(
        db,
        selection,
        page_index=page_index
    )


@uni.get("/campus/{id}")
async def read_campus(id: UUID, db=Depends(get_db)):
    campus = await lookup_campus(db, id)
    return await CampusDetail.from_model(campus)


@uni.get("/funding")
async def index_research_fundings(
    name: str | None = None, page_index: int = 1, db=Depends(get_db)
) -> FundingIndexPage:
    selection = query_fundings(
        name_eq=name,
        text=''
    )
    return await FundingIndexPage.from_selection(
        db,
        selection,
        page_index=page_index
    )

@uni.get("/funding/{funding_id}")
async def get_research_funding(
    funding_id: UUID, db=Depends(get_db)
) -> FundingDetail:
    funding = await Funding.get_for_id(db, funding_id)
    return await FundingDetail.from_model(funding)

@uni.get("/budget")
async def index_budgets(
    funding: UUID | None = None,
    funding_name: str | None = None,
    lab: UUID | None = None,
    research_plan: UUID | None = None,
    page_index: int = 1,
    db = Depends(get_db)
) -> BudgetIndexPage:
    if funding:
        funding_ = funding
    elif funding_name:
        funding_ = query_fundings(name_eq=funding_name)
    else:
        funding = None

    selection = query_budgets(
        funding = funding_,
        lab=lab,
        research_plan=research_plan,
    )

    return await BudgetIndexPage.from_selection(
        db,
        selection,
        page_index=page_index
    )
