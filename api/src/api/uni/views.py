
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends
from api.uni.queries import query_campuses

from db import get_db
from api.base.schemas import PagedResultList

from .schemas import Campus
from .types import CampusCode

uni_campuses = APIRouter(
    prefix="/uni/campuses",
    tags=["campuses"]
)

@uni_campuses.get(
    '/{code_or_id}'
)
async def read_campus(code_or_id: CampusCode | UUID, db = Depends(get_db)):
    match code_or_id:
        case CampusCode():
            return await Campus.get_for_campus_code(db, code_or_id) 
        case UUID():
            return await Campus.get_for_id(db, code_or_id)
   

@uni_campuses.get('/')
async def index_campuses(
    text: Optional[str] = None,
    db = Depends(get_db)
) -> PagedResultList[Campus]:
    return await PagedResultList[Campus].from_selection(
        Campus,
        db,
        query_campuses(text_like=text),
    )
        

