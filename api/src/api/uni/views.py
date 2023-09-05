
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends

from api.utils.db import get_db
from api.base.schemas import PagedResultList

from .schemas import Campus
from .types import CampusCode
from .model_fns import get_campus, list_campuses

uni_campuses = APIRouter(
    prefix="/uni/campuses",
    tags=["campuses"]
)

@uni_campuses.get(
    '/{code_or_id}'
)
async def read_campus(code_or_id: CampusCode | UUID, db = Depends(get_db)):
    if code_or_id:
        return await get_campus(db, code_or_id)

@uni_campuses.get('/')
async def search_campuses(
    name_startswith: Optional[str] = None,
    db = Depends(get_db)
) -> PagedResultList[Campus]:
    campuses = await list_campuses(db, name_startswith=name_startswith)
    return PagedResultList(
        items=campuses,
        total_item_count=len(campuses),
        page_index=0
    )
        

