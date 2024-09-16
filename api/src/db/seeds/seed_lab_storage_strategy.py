
from sqlalchemy import insert

from db import LocalSession
from db.models.base import DoesNotExist
from db.models.lab import LabStorageStrategy

async def seed_lab_storage_strategy(db: LocalSession):
    async def maybe_create(name: str, description: str):
        try:
            return await LabStorageStrategy.get_for_name(db, name)
        except DoesNotExist:
            strategy = LabStorageStrategy(name=name, description=description)
            db.add(strategy)
            await db.commit()
            return strategy


    await maybe_create(name="general", description="general storage")
