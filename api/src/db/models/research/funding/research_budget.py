from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Select, func, ForeignKey, select
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import local_object_session
from db.models.base import Base
from db.models.base.errors import ModelException
from db.models.fields import uuid_pk
from db.models.research.funding.purchase import ResearchPurchaseOrder
from db.models.user import User

from .research_funding import ResearchFunding

from .purchase import ResearchPurchase

class ResearchBudget(Base):
    __tablename__ = "research_budget"

    id: Mapped[uuid_pk] = mapped_column()

    funding_id: Mapped[UUID] = mapped_column(ForeignKey("research_funding.id"))
    funding: Mapped[ResearchFunding] = relationship()

    items: Mapped[list[ResearchPurchase]] = relationship(
        back_populates="budget",
        order_by=ResearchPurchase.index,
        cascade="all, delete-orphan",
    )

    async def item_count(self) -> int:
        using = local_object_session(self)
        result = await using.scalar(
            select(func.count(ResearchPurchase.id))
            .select_from(ResearchBudget, ResearchPurchase)
            .where(ResearchBudget.id == self.id)
        )
        if result is None:
            raise ModelException('No value returned from count')
        return result

    async def append_purchase(
        self,
        order: ResearchPurchaseOrder,
    ) -> ResearchPurchase:
        using = local_object_session(self)

        ordered_by = await order.awaitable_attrs.created_by

        item = ResearchPurchase(
            order,
            budget=self,
            index=await self.item_count(),
            estimated_cost=order.estimated_cost,
            ordered_by=ordered_by,
        )
        using.add(item)
        await using.commit()
        return item

def query_research_budgets() -> Select[tuple[ResearchBudget]]:
    return select(ResearchBudget)
