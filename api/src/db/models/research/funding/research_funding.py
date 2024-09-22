
from uuid import UUID
from sqlalchemy import or_, select, Select
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from db import LocalSession
from db.models.base import Base, DoesNotExist
from db.models.fields import uuid_pk

class ResearchFundingDoesNotExist(DoesNotExist):
    def __init__(self, *, for_name: str | None = None, for_id: UUID | None = None):
        if for_name:
            msg = f"No research funding with name {for_name}"
            return super().__init__(msg)
        if for_id:
            return super().__init__("ResearchFunding", for_id=for_id)
        raise ValueError("Either for_id or for_name must be provided")


class ResearchFunding(Base):
    __tablename__ = "research_funding"

    id: Mapped[uuid_pk] = mapped_column()

    name: Mapped[str] = mapped_column(postgresql.VARCHAR(32), unique=True)
    description: Mapped[str] = mapped_column(postgresql.TEXT, server_default="")

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        instance = await db.get(ResearchFunding, id)
        if not instance:
            raise ResearchFundingDoesNotExist(for_id=id)

        return instance

    @classmethod
    async def get_for_name(cls, db: LocalSession, name: str):
        instance = await db.scalar(
            select(ResearchFunding).where(ResearchFunding.name == name)
        )
        if not instance:
            raise ResearchFundingDoesNotExist(for_name=name)
        return instance

    @property
    def is_lab_funding(self):
        return self.name == 'lab'


def query_research_fundings(
    name_eq: str | None = None, text: str | None = None
) -> Select[tuple[ResearchFunding]]:
    clauses: list = []

    if name_eq is not None:
        clauses.append(ResearchFunding.name.ilike(name_eq))

    if text is not None:
        clauses.append(
            or_(
                ResearchFunding.name.ilike(f"%{text}%"),
                ResearchFunding.description.ilike(f"%{text}%"),
            )
        )

    return select(ResearchFunding).where(*clauses)
