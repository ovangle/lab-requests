from __future__ import annotations

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.types import VARCHAR
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from api.base.models import Base
from api.uni.research.errors import FundingModelDoesNotExist
from db import LocalSession
from db.orm import uuid_pk

class FundingModel_(Base):
    __tablename__ = 'uni_research_funding_model'
    id: Mapped[uuid_pk]

    description: Mapped[str] = mapped_column(VARCHAR(128))
    requires_supervisor: Mapped[bool] = mapped_column()

    def __init__(self, description: str, requires_supervisor: bool = True):
        super().__init__()
        self.description = description
        self.requires_supervisor = requires_supervisor

    @staticmethod
    async def get_for_id(db: LocalSession, id: UUID) -> FundingModel_:
        instance = await db.get(FundingModel_, id)
        if instance is None:
            raise FundingModelDoesNotExist.for_id(id)
        return instance


async def seed_funding_models(db: LocalSession):
    builtin_funding_models = [
        FundingModel_('Grant', requires_supervisor=True),
        FundingModel_('General Research', requires_supervisor=True),
        FundingModel_('Student project', requires_supervisor=True),
    ]
    builtin_descriptions = [builtin.description for builtin in builtin_funding_models]

    existing_descriptions = await db.scalars(
        select(FundingModel_.description)
            .where(FundingModel_.description.in_(builtin_descriptions))
    )

    db.add_all(builtin for builtin in builtin_funding_models if builtin.description not in existing_descriptions)
    await db.commit()
