from uuid import UUID
from fastapi import APIRouter, Depends

from api.schemas.uni.campus import (
    CampusDetail,
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
