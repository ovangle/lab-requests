from typing import Optional
from fastapi import APIRouter, Depends
from api.base.schemas import PagedResultList

from api.utils.db import LocalSession, get_db

from .model_queries import query_funding_models
from .schemas import FundingModel

uni_research_funding = APIRouter(
    prefix="/uni/research/funding",
    tags=["research", "funding"]
)

@uni_research_funding.get("/")
async def index_models(
    description_like: Optional[str] = None,
    db: LocalSession = Depends(get_db)
):
    query = query_funding_models(description_like=description_like)
    return PagedResultList.from_selection(FundingModel, db, query)

