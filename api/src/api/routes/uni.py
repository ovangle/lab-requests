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

@uni.get("/campus")
async def index_campuses(
    code_eq: str | None = None,
    text_like: str | None = None,
    page: int = 1,
    db=Depends(get_db),
) -> CampusIndexPage:
    index = CampusIndex(code_eq=code_eq, search=text_like, page_index=page)
    return await index.load_page(db)


@uni.get("/campus/{id}")
async def read_campus(id: UUID, db=Depends(get_db)):
    campus = await lookup_campus(db, id)
    return await CampusDetail.from_model(campus)
