from uuid import UUID
from fastapi import APIRouter, Depends

from api.schemas.uni.campus import (
    CampusDetail,
    CampusIndex,
    CampusIndexPage,
    lookup_campus,
)
from db import get_db
from db.models.uni.campus import query_campuses


uni = APIRouter(prefix="/uni")

uni_campuses = APIRouter(prefix="/campuses", tags=["campuses"])


@uni_campuses.get("/")
async def index_campuses(
    code_eq: str | None = None,
    text_like: str | None = None,
    page: int = 1,
    db=Depends(get_db),
) -> CampusIndexPage:
    index = CampusIndex()
    index.code_eq = code_eq
    index.search = text_like
    index.page_index = page

    return await index.load_page(db)


@uni_campuses.get("/campus/{id}")
async def read_campus(id: UUID, db=Depends(get_db)):
    campus = await lookup_campus(db, id)
    return await CampusDetail.from_model(campus)


uni.include_router(uni_campuses)
