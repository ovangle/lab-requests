from typing import Optional
from uuid import UUID
from sqlalchemy import select

from db import LocalSession
from .types import CampusCode
from .errors import CampusDoesNotExist
from . import models
from . import schemas

async def get_campus(db: LocalSession, code_or_id: CampusCode | UUID) -> schemas.Campus:
    if isinstance(code_or_id, CampusCode):
        campus = await models.Campus.get_for_campus_code(db, code_or_id)
    elif isinstance(code_or_id, UUID):
        campus = await models.Campus.get_for_id(db, code_or_id)

    return await schemas.Campus.from_model(campus)


async def list_campuses(db: LocalSession, *, name_startswith=None) -> list[schemas.Campus]:
    query = select(models.Campus)
    if name_startswith:
        query = query.where(models.Campus.name.istartswith(name_startswith))

    results = await db.scalars(query)
    return await schemas.Campus.gather_models(results)


async def get_or_create_campus(db: LocalSession, params: Optional[schemas.CampusCreate] = None, /, **kwargs):
    params = params or schemas.CampusCreate(**kwargs)
    try:
        existing = await get_campus(db, params.code)
        return existing
    except CampusDoesNotExist:
        campus = models.Campus(code=params.code, name=params.name)
        db.add(campus)
        await db.commit()
        return schemas.Campus.from_model(campus)


async def update_campus(db: LocalSession, campus: schemas.Campus, patch: Optional[schemas.CampusPatch] = None, **kwargs) -> schemas.Campus:
    patch = patch or schemas.CampusPatch(**kwargs)
    model = await models.Campus.get_for_id(db, campus.id)
    model.name = patch.name

    db.add(model)
    await db.commit()

    return await schemas.Campus.from_model(model)