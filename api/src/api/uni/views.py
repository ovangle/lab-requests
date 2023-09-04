
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends

from api.src.api.utils.db import Session

from .schemas import Campus
from .types import CampusCode
from .model_fns import get_campus, list_campuses_by_name

campuses = APIRouter()

@campuses.get(
    '/campus/{code_or_id}'
)
async def read_campus(code_or_id: CampusCode | UUID, db = Depends(Session)):
    if code_or_id:
        return await get_campus(db, code_or_id)

@campuses.get('/')
async def search_campuses(
    code: Optional[CampusCode] = None,
    name: Optional[str] = '',
    db = Depends(Session)
) -> list[Campus]:
    if code: 
        campus = await get_campus(db, code)
        return [campus]

    if name:
        return await list_campuses_by_name(db, name)
    
    raise ValueError('Must provide either code or name query params')
        

