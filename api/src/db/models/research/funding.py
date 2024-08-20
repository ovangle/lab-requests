from __future__ import annotations

from uuid import UUID
from sqlalchemy import ForeignKey, Select, or_, select, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from sqlalchemy.dialects import postgresql

from db import LocalSession, local_object_session

from ..base import Base
from ..base.errors import DoesNotExist
from ..fields import uuid_pk


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


def query_research_fundings(
    name_eq: str | None = None, text: str | None = None
) -> Select[tuple[ResearchFunding]]:
    clauses: list = []
    if name_eq is not None:
        clauses.append(ResearchFunding.name.ilike(f"%{name_eq}%"))

    if text is not None:
        clauses.append(
            or_(
                ResearchFunding.name.ilike(f"%{text}%"),
                ResearchFunding.description.ilike(f"%{text}%"),
            )
        )

    return select(ResearchFunding).where(*clauses)


class ResearchBudgetItem(Base):
    __tablename__ = "research_budget_item"

    id: Mapped[uuid_pk] = mapped_column()
    budget_id: Mapped[UUID] = mapped_column(ForeignKey("research_budget.id"))
    budget: Mapped[ResearchBudget] = relationship(back_populates="items")

    index: Mapped[int] = mapped_column(postgresql.INTEGER, default=0, index=True)

    estimated_cost: Mapped[float] = mapped_column(postgresql.FLOAT)
    actual_cost: Mapped[float] = mapped_column(postgresql.FLOAT, default=0.0)


class ResearchBudget(Base):
    __tablename__ = "research_budget"

    id: Mapped[uuid_pk] = mapped_column()

    funding_id: Mapped[UUID] = mapped_column(ForeignKey("research_budget.id"))
    funding: Mapped[ResearchFunding] = relationship()

    items: Mapped[list[ResearchBudgetItem]] = relationship(
        back_populates="budget",
        order_by=ResearchBudgetItem.index,
        cascade="all, delete-orphan",
    )

    async def item_count(self, *, using: LocalSession | None = None):
        using = using or local_object_session(self)
        return await using.scalar(
            select(func.count(ResearchBudgetItem.id))
            .select_from(ResearchBudget, ResearchBudgetItem)
            .where(ResearchBudget.id == self.id)
        )

    async def append(
        self, estimated_cost: float = 0.0, *, using: LocalSession | None = None
    ) -> ResearchBudgetItem:
        using = using or local_object_session(self)

        item = ResearchBudgetItem(
            budget_id=self.id,
            index=await self.item_count(using=using),
            estimated_cost=estimated_cost,
        )
        using.add(item)
        await using.commit()
        return item
