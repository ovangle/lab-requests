from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Select, func, ForeignKey, select
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import local_object_session
from db.models.base import Base
from db.models.base.base import model_id
from db.models.base.errors import ModelException
from db.models.fields import uuid_pk
from db.models.user import User

from .funding import Funding

from .purchase import Purchase, PurchaseOrder

if TYPE_CHECKING:
    from db.models.lab import Lab
    from db.models.research.plan import ResearchPlan

class Budget(Base):
    __tablename__ = "uni_budget"

    id: Mapped[uuid_pk] = mapped_column()

    funding_id: Mapped[UUID] = mapped_column(ForeignKey("uni_funding.id"))
    funding: Mapped[Funding] = relationship()

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    # lab: Mapped[Lab] = relationship()

    research_plan_id: Mapped[UUID | None] = mapped_column(ForeignKey("research_plan.id"), nullable=True)
    # research_plan: Mapped[ResearchPlan | None] = relationship()

    @property
    def is_lab_budget(self):
        return self.research_plan_id is None

    def __init__(self, funding: Funding, lab: Lab | None = None, research: ResearchPlan | None = None, **kwargs):
        self.funding_id = funding.id

        if research:
            if lab and model_id(lab) != research.lab_id:
                raise ValueError("Lab must match research lab")
            if funding.is_lab_funding:
                raise ValueError("Funding source must not be dedicated lab funding")
            self.lab_id = research.lab_id
            self.research_plan_id = research.id

        else:
            if not funding.is_lab_funding:
                raise ValueError("Funding source must be dedicated lab funding")
            if not lab:
                raise ValueError("Lab must be provided for lab funding")
            self.lab_id = lab.id
            self.research_plan_id = None

        super().__init__(**kwargs)


    items: Mapped[list[Purchase]] = relationship(
        back_populates="budget",
        order_by=Purchase.index,
        cascade="all, delete-orphan",
    )

    async def item_count(self) -> int:
        using = local_object_session(self)
        result = await using.scalar(
            select(func.count(Purchase.id))
            .select_from(Budget, Purchase)
            .where(Budget.id == self.id)
        )
        if result is None:
            raise ModelException('No value returned from count')
        return result

    async def append_purchase(
        self,
        order: PurchaseOrder,
    ) -> Purchase:
        using = local_object_session(self)
        ordered_by = await order.awaitable_attrs.created_by

        item = Purchase(
            order,
            budget=self,
            index=await self.item_count(),
            estimated_cost=order.estimated_cost,
            ordered_by=ordered_by,
        )
        using.add(item)
        await using.commit()
        return item

def query_budgets(
    funding: Select[tuple[Funding]] | Funding | UUID | None = None,
    lab: Lab | UUID | None = None,
    research_plan: ResearchPlan | UUID | None = None
) -> Select[tuple[Budget]]:
    where_clauses = []

    if isinstance(funding, Select):
        subquery = select(funding.c.id)

        where_clauses.append(
            Budget.funding_id.in_(subquery)
        )
    elif funding is not None:
        where_clauses.append(
            Budget.funding_id == model_id(funding)
        )

    if lab:
        where_clauses.append(
            Budget.lab_id == model_id(lab)
        )

    if research_plan:
        where_clauses.append(
            Budget.research_plan_id == model_id(research_plan)
        )

    return select(Budget).where(*where_clauses)