from uuid import UUID
from typing import Optional, Union
from fastapi import APIRouter, Depends

from db import LocalSession, get_db

from api.base.schemas import PagedResultList
from .model_queries import query_funding_models
from .schemas import FundingModel

uni_research_funding = APIRouter(
    prefix="/uni/research/funding", tags=["research", "funding"]
)


@uni_research_funding.get("/")
async def index_models(
    name_eq: str | None = None,
    text: str | None = None,
    db: LocalSession = Depends(get_db),
) -> PagedResultList[FundingModel]:
    query = query_funding_models(name_eq=name_eq, text=text)
    return await PagedResultList[FundingModel].from_selection(FundingModel, db, query)


@uni_research_funding.get("/{name_or_id}")
async def get_funding_model(
    name_or_id: Union[UUID, str], db: LocalSession = Depends(get_db)
):
    match name_or_id:
        case UUID():
            return await FundingModel.get_for_id(db, name_or_id)
        case str():
            return await FundingModel.get_for_name(db, name_or_id)
        case _:
            raise Exception("Expected a name or id")
