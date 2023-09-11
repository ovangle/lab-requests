from __future__ import annotations

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.types import VARCHAR
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from api.base.models import Base
from api.utils.db import LocalSession, uuid_pk

class FundingModel(Base):
    __tablename__ = 'uni_research_funding_model'
    id: Mapped[uuid_pk]

    description: Mapped[str] = mapped_column(VARCHAR(128))
    requires_supervisor: Mapped[bool] = mapped_column()

    @staticmethod
    async def fetch_by_id(db: LocalSession, id: UUID) -> FundingModel:
        return await db.get(FundingModel, id)


async def seed_funding_models(db: LocalSession):
    builtin_funding_models = [
        FundingModel(description='Grant', requires_supervisor=True),
        FundingModel(description='General Research', requires_supervisor=True),
        FundingModel(description='Student project', requires_supervisor=True),
    ]
    builtin_descriptions = [builtin.description for builtin in builtin_funding_models]

    existing_descriptions = await db.scalars(
        select(FundingModel.description)
            .where(FundingModel.description.in_(builtin_descriptions))
    )

    db.add_all(builtin for builtin in builtin_funding_models if builtin.description not in existing_descriptions)
    await db.commit()
