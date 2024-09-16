
from sqlalchemy import insert

from db import LocalSession
from db.models.base import DoesNotExist
from db.models.lab import DisposalStrategy

async def seed_lab_disposal_strategy(db: LocalSession):
    async def maybe_create(name: str, description: str):
        try:
            return await DisposalStrategy.get_for_name(db, name)
        except DoesNotExist:
            strategy = DisposalStrategy(name=name, description=description)
            db.add(strategy)
            await db.commit()
            return strategy


    await maybe_create(name="general waste", description="general waste")
