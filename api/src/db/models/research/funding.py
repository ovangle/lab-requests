from uuid import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects import postgresql

from db import LocalSession

from ..base import Base
from ..base.errors import DoesNotExist
from ..base.fields import uuid_pk


class ResearchFundingDoesNotExist(DoesNotExist):
    pass


class ResearchFunding(Base):
    __tablename__ = "research_funding"

    id: Mapped[uuid_pk]

    name: Mapped[str] = mapped_column(postgresql.VARCHAR(32))
    description: Mapped[str] = mapped_column(postgresql.TEXT, server_default="")

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        instance = await db.get(ResearchFunding, id)
        if not instance:
            raise ResearchFundingDoesNotExist(for_id=id)

        return instance
