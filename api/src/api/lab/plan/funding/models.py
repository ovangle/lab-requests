from __future__ import annotations

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.types import VARCHAR
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from api.base.models import Base
from api.utils.db import LocalSession, uuid_pk

class ExperimentalPlanFundingModel(Base):
    __tablename__ = 'experimental_plan_fundings'
    id: Mapped[uuid_pk]

    description: Mapped[str] = mapped_column(VARCHAR(128))
    requires_supervisor: Mapped[bool] = mapped_column()

    @staticmethod
    async def exists(db: LocalSession, id: UUID) -> bool:
        counts = await db.execute(
            select(func.count())
                .select_from(ExperimentalPlanFundingModel)
                .where(ExperimentalPlanFundingModel.id == id)
        )
        count = counts.first()
        assert count is not None
        return count[0] > 0

    @staticmethod
    async def fetch_by_id(db: LocalSession, id: UUID) -> ExperimentalPlanFundingModel:
        return await db.get(ExperimentalPlanFundingModel, id)

