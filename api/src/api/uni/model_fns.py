from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .types import CampusCode
from . import models
from . import schemas

async def get_campus(db: AsyncSession, code_or_id: CampusCode | UUID) -> schemas.Campus:
    if isinstance(code_or_id, CampusCode):
        campus = await models.Campus.get_by_code(db, code_or_id)
    elif isinstance(code_or_id, UUID):
        campus = await models.Campus.get_by_id(db, code_or_id)

    return schemas.Campus.from_model(campus)


async def get_or_create_campus(db: AsyncSession, params: Optional[schemas.CampusCreate] = None, /, **kwargs):
    params = params or schemas.CampusCreate(**kwargs)
    code_or_id = params.id or params.code
    try:
        existing = await get_campus(db, code_or_id)
        return existing

    except models.CampusDoesNotExist:
        campus = models.Campus(id=params.id, code=params.code, name=params.name)
        db.add(campus)
        await db.commit()
        return schemas.Campus.from_model(campus)


async def update_campus(db: AsyncSession, campus: schemas.Campus, patch: Optional[schemas.CampusPatch] = None, **kwargs) -> schemas.Campus:
    patch = patch or schemas.CampusPatch(**kwargs)
    model = await models.Campus.get_by_id(db, campus.id)
    model.name = patch.name

    db.add(model)
    await db.commit()

    return schemas.Campus.from_model(model)