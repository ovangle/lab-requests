from __future__ import annotations

from datetime import datetime
from typing import Optional, Self, override
from uuid import UUID, uuid4

from sqlalchemy import Select, select
from db import LocalSession, local_object_session

from db.models.research.funding import (
    ResearchFunding,
    query_research_fundings,
    ResearchBudget,
    ResearchPurchase,
    ResearchPurchaseOrder,
    PurchaseStatus,
)
from db.models.research.funding.purchase import query_research_purchases


from ..base import (
    ModelCreateRequest,
    ModelUpdateRequest,
    ModelDetail,
    ModelLookup,
    ModelIndexPage,
)


class ResearchFundingDetail(ModelDetail[ResearchFunding]):
    id: UUID
    name: str
    description: str

    @classmethod
    async def from_model(cls, model: ResearchFunding):
        return cls(
            id=model.id,
            name=model.name,
            description=model.description,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class ResearchFundingLookup(ModelLookup[ResearchFunding]):
    id: Optional[UUID] = None
    name: Optional[str] = None

    async def get(self, db: LocalSession):
        if self.id:
            return await ResearchFunding.get_for_id(db, self.id)
        if self.name:
            return await ResearchFunding.get_for_name(db, self.name)
        raise ValueError("Either id or name must be provided")


class ResearchFundingIndexPage(ModelIndexPage[ResearchFunding, ResearchFundingDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: ResearchFunding):
        return await ResearchFundingDetail.from_model(item)

class ResearchFundingUpdateRequest(ModelUpdateRequest[ResearchFunding]):
    description: str

    async def do_update(self, model: ResearchFunding, **kwargs) -> ResearchFunding:
        if self.description != model.description:
            model.description = self.description

        return model


class ResearchFundingCreateRequest(ModelCreateRequest[ResearchFunding]):
    name: str
    description: str

    async def do_create(self, db: LocalSession, **kwargs) -> ResearchFunding:
        model = ResearchFunding(
            id=uuid4(), name=self.name, description=self.description
        )
        db.add(model)
        return model


ResearchFundingRef = ResearchFundingLookup | UUID


async def lookup_research_funding(db: LocalSession, ref: ResearchFundingRef):
    if isinstance(ref, UUID):
        return await ResearchFunding.get_for_id(db, ref)
    return await ref.get(db)


async def lookup_or_create_research_funding(
    db: LocalSession, ref_or_create: ResearchFundingRef | ResearchFundingCreateRequest
):
    match ref_or_create:
        case ResearchFundingCreateRequest():
            return await ref_or_create.do_create(db)
        case _:
            return await lookup_research_funding(db, ref_or_create)



class ResearchPurchaseDetail(ModelDetail[ResearchPurchase]):
    budget_id: UUID
    purchase_order_type: str
    purchase_order_id: UUID
    index: int

    estimated_cost: float
    actual_cost: float

    status: PurchaseStatus
    ordered_by_id: UUID
    ordered_at: datetime

    ready_at: datetime | None
    is_ready: bool

    paid_by_id: UUID | None
    paid_at: datetime | None
    is_paid: bool

    reviewed_by_id: UUID | None
    reviewed_at: datetime | None
    is_reviewed: bool

    is_finalised: bool

    @classmethod
    async def from_model(cls, model: ResearchPurchase):
        return await super()._from_base(
            model,
            budget=model.budget_id,
            purchase_order_type=model.purchase_order_type,
            purchase_order_id=model.purchase_order_id,
            index=model.index,
            estimated_cost=model.estimated_cost,
            actual_cost=model.actual_cost,
            status=model.status,
            ordered_by_id=model.ordered_by_id,
            ordered_at=model.ordered_at,
            ready_at=model.ready_at,
            is_ready=model.is_ready,
            paid_by_id=model.paid_by_id,
            paid_at=model.paid_at,
            reviewed_by_id=model.reviewed_by_id,
            reviewed_at=model.reviewed_at,
            is_finalised=model.is_finalised
        )


class ResearchPurchaseIndexPage(ModelIndexPage[ResearchPurchase, ResearchPurchaseDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: ResearchPurchase):
        return await ResearchPurchaseDetail.from_model(item)


class ResearchBudgetSummary(ModelDetail[ResearchBudget]):
    """
    Limited view of research budget which does not contain information about other purchases.
    """

    funding: ResearchFundingDetail
    lab_id: UUID
    research_plan_id: UUID | None

    @classmethod
    async def _from_research_budget(cls, model: ResearchBudget, **kwargs) -> Self:
        funding = await ResearchFundingDetail.from_model(await model.awaitable_attrs.funding)

        return await cls._from_base(
            model,
            funding=funding,
            lab_id=model.lab_id,
            research_plan_id=model.research_plan_id,
            **kwargs
        )

    @classmethod
    async def from_model(cls, model: ResearchBudget):
        return await cls._from_research_budget(model)



class ResearchBudgetDetail(ResearchBudgetSummary):
    purchases: ResearchPurchaseIndexPage

    @classmethod
    async def _from_research_budget(cls, model: ResearchBudget, **kwargs) -> Self:
        db = local_object_session(model)
        purchases = await ResearchPurchaseIndexPage.from_selection(
            db,
            query_research_purchases(budget=model),
        )

        return await super()._from_research_budget(
            model,
            purchases=purchases
        )

class ResearchBudgetIndexPage(ModelIndexPage[ResearchBudget, ResearchBudgetDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: ResearchBudget):
        return await ResearchBudgetDetail.from_model(item)


class ResearchPurchaseOrderDetail(ModelDetail[ResearchPurchaseOrder]):
    budget: ResearchBudgetSummary

    ordered_by_id: UUID
    estimated_cost: float
    purchase: ResearchPurchaseDetail

    @classmethod
    async def _from_purchase_order(cls, purchase_order: ResearchPurchaseOrder):
        budget = await ResearchBudgetSummary.from_model(
            await purchase_order.awaitable_attrs.budget
        )
        purchase = await ResearchPurchaseDetail.from_model(
            await purchase_order.get_or_create_purchase()
        )

        return cls._from_base(
            purchase_order,
            budget=budget,
            ordered_by_id=purchase_order.created_by_id,
            purchase=purchase
        )


class ResearchPurchaseOrderCreate(ModelCreateRequest[ResearchPurchaseOrder]):
    type: str
    budget: UUID
    estimated_cost: float
    url: str | None = None
    instructions: str