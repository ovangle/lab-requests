from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends
from api.uni.queries import query_campuses

from db import get_db
from db.models.uni import Campus
from api.base.schemas import ModelIndexPage

from ..schemas.uni.schemas import (
    CampusIndexPage,
    CampusView,
    CampusIndex,
    CampusLookup,
    lookup_campus,
)

uni_campuses = APIRouter(prefix="/uni/campuses", tags=["campuses"])


@uni_campuses.get("/{id}")
async def read_campus(id: UUID, db=Depends(get_db)):
    campus = await lookup_campus(db, id)
    return await CampusView.from_model(campus)


@uni_campuses.get("/")
async def index_campuses(
    code_eq: Optional[str] = None,
    text_like: Optional[str] = None,
    page_index: int = 0,
    db=Depends(get_db),
) -> CampusIndexPage:
    query = query_campuses(code_eq=code_eq, search=text_like)
    return await CampusIndex(query).load_page(db, page_index)
