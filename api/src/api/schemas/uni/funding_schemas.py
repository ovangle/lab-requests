from __future__ import annotations

from datetime import datetime
from typing import Optional, Self, override
from uuid import UUID, uuid4

from sqlalchemy import Select, select
from db import LocalSession, local_object_session

from db.models.uni.funding import (
    Funding,
    query_fundings,
    Budget,
    Purchase,
    query_purchases,
    PurchaseOrder,
    PurchaseStatus,
)


from ..base_schemas import (
    ModelCreateRequest,
    ModelUpdateRequest,
    ModelDetail,
    ModelLookup,
    ModelIndexPage,
)


class FundingDetail(ModelDetail[Funding]):
    id: UUID
    name: str
    description: str

    @classmethod
    async def from_model(cls, model: Funding):
        return cls(
            id=model.id,
            name=model.name,
            description=model.description,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class FundingIndexPage(ModelIndexPage[Funding, FundingDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: Funding):
        return await FundingDetail.from_model(item)

class FundingUpdateRequest(ModelUpdateRequest[Funding]):
    description: str

    async def do_update(self, model: Funding, **kwargs) -> Funding:
        if self.description != model.description:
            model.description = self.description

        return model


class FundingCreateRequest(ModelCreateRequest[Funding]):
    name: str
    description: str

    async def do_create(self, db: LocalSession, **kwargs) -> Funding:
        model = Funding(
            id=uuid4(), name=self.name, description=self.description
        )
        db.add(model)
        return model



class PurchaseDetail(ModelDetail[Purchase]):
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
    async def from_model(cls, model: Purchase):
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


class PurchaseIndexPage(ModelIndexPage[Purchase, PurchaseDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: Purchase):
        return await PurchaseDetail.from_model(item)


class BudgetSummary(ModelDetail[Budget]):
    """
    Limited view of research budget which does not contain information about other purchases.
    """

    funding: FundingDetail
    lab_id: UUID
    research_plan_id: UUID | None

    @classmethod
    async def _from_research_budget(cls, model: Budget, **kwargs) -> Self:
        funding = await FundingDetail.from_model(await model.awaitable_attrs.funding)

        return await cls._from_base(
            model,
            funding=funding,
            lab_id=model.lab_id,
            research_plan_id=model.research_plan_id,
            **kwargs
        )

    @classmethod
    async def from_model(cls, model: Budget):
        return await cls._from_research_budget(model)



class BudgetDetail(BudgetSummary):
    purchases: PurchaseIndexPage

    @classmethod
    async def _from_research_budget(cls, model: Budget, **kwargs) -> Self:
        db = local_object_session(model)
        purchases = await PurchaseIndexPage.from_selection(
            db,
            query_purchases(budget=model),
        )

        return await super()._from_research_budget(
            model,
            purchases=purchases
        )

class BudgetIndexPage(ModelIndexPage[Budget, BudgetDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: Budget):
        return await BudgetDetail.from_model(item)


class PurchaseOrderDetail(ModelDetail[PurchaseOrder]):
    budget: BudgetSummary

    ordered_by_id: UUID
    estimated_cost: float
    purchase: PurchaseDetail

    @classmethod
    async def _from_purchase_order(cls, purchase_order: PurchaseOrder):
        budget = await BudgetSummary.from_model(
            await purchase_order.awaitable_attrs.budget
        )
        purchase = await PurchaseDetail.from_model(
            await purchase_order.get_or_create_purchase()
        )

        return cls._from_base(
            purchase_order,
            budget=budget,
            ordered_by_id=purchase_order.created_by_id,
            purchase=purchase
        )


class PurchaseOrderCreate(ModelCreateRequest[PurchaseOrder]):
    type: str
    budget: UUID
    estimated_cost: float
    url: str | None = None
    instructions: str