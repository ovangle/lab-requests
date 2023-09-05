from typing import Optional
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .types import CampusCode
from .errors import CampusDoesNotExist
from . import models
from . import schemas

async def get_campus(db: AsyncSession, code_or_id: CampusCode | UUID) -> schemas.Campus:
    if isinstance(code_or_id, CampusCode):
        campus = await models.Campus.get_for_campus_code(db, code_or_id)
    elif isinstance(code_or_id, UUID):
        campus = await models.Campus.get_for_id(db, code_or_id)

    return schemas.Campus.from_model(campus)


async def list_campuses(db: AsyncSession, *, name_startswith=None) -> list[schemas.Campus]:
    query = select(models.Campus)
    if name_startswith:
        query = query.where(models.Campus.name.istartswith(name_startswith))

    results = await db.execute(query)
    print(f'found {results} campuses with name prefixed by {name_startswith}')
    return [schemas.Campus.from_model(result[0]) for result in results]


async def get_or_create_campus(db: AsyncSession, params: Optional[schemas.CampusCreate] = None, /, **kwargs):
    params = params or schemas.CampusCreate(**kwargs)
    code_or_id = params.id or params.code
    try:
        existing = await get_campus(db, code_or_id)
        return existing

    except CampusDoesNotExist:
        campus = models.Campus(id=params.id, code=params.code, name=params.name)
        db.add(campus)
        await db.commit()
        return schemas.Campus.from_model(campus)


async def update_campus(db: AsyncSession, campus: schemas.Campus, patch: Optional[schemas.CampusPatch] = None, **kwargs) -> schemas.Campus:
    patch = patch or schemas.CampusPatch(**kwargs)
    model = await models.Campus.get_for_id(db, campus.id)
    model.name = patch.name

    db.add(model)
    await db.commit()

    return schemas.Campus.from_model(model)