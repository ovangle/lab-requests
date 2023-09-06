from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from . import models
from . import schemas

async def get_equipment_by_id(
    db: AsyncSession,
    id: UUID
) -> schemas.Equipment:
    model = await models.Equipment.get_by_id(db, id)
    return schemas.Equipment.from_model(model)