from __future__ import annotations

from abc import abstractmethod
from datetime import datetime
from typing import Any, Generic, Literal, TypeVar, Union, override
from uuid import UUID

from fastapi import Depends

from api.auth.context import (
    get_current_authenticated_user,
)
from db import LocalSession, get_db
from db.models.lab.lab import Lab
from db.models.lab.provisionable import (
    Provisionable,
    LabProvision,
    ProvisionStatus,
    ProvisionTransition,
)
from db.models.user import User
from db.models.uni.funding import Budget

from .lab_work_schemas import LabWorkDetail
from api.schemas.uni import PurchaseDetail, PurchaseOrderCreate, PurchaseOrderDetail
from ..base_schemas import (
    ModelCreateRequest,
    ModelDetail,
    ModelIndexPage,
    ModelRequestContextError,
    ModelUpdateRequest,
)

TProvisionable = TypeVar('TProvisionable', bound=Provisionable)
TParams = TypeVar("TParams")


__provision_detail_types: dict[str, type[LabProvisionDetail]] = {}

def register_provision_detail_cls(action_name: str, impl: type[LabProvisionDetail]):
    if action_name in __provision_detail_types:
        raise TypeError(f"{action_name} provision detail already registered")
    __provision_detail_types[action_name] = impl


class LabProvisionDetail(PurchaseOrderDetail, Generic[TProvisionable, TParams]):
    action: str
    status: ProvisionStatus

    lab_id: UUID
    provisionable_type: str
    provisionable_id: UUID

    budget_id: UUID | None
    purchase: PurchaseDetail | None

    work: LabWorkDetail | None

    requested_by_id: UUID
    requested_at: datetime

    all_requests: list[ProvisionTransition]

    is_rejected: bool
    rejected_at: datetime | None
    rejected_by_id: UUID | None

    all_rejections: list[ProvisionTransition]

    is_denied: bool
    denied_at: datetime | None
    denied_by_id: UUID | None

    is_approved: bool
    approved_at: datetime | None
    approved_by_id: UUID | None

    is_purchased: bool
    purchased_at: datetime | None
    purchased_by_id: UUID | None

    is_completed: bool
    completed_at: datetime | None
    completed_by_id: UUID | None

    is_cancelled: bool
    cancelled_at: datetime | None
    cancelled_by_id: UUID | None

    is_finalised: bool
    finalised_at: datetime | None
    finalised_by_id: UUID | None

    @classmethod
    async def _from_lab_provision(
        cls,
        lab_provision: LabProvision[TProvisionable, TParams],
        action: str,
        action_params: TParams,
        **kwargs
    ):
        purchase = await PurchaseDetail.from_model(await lab_provision.awaitable_attrs.purchase)

        return await cls._from_base(
            lab_provision,
            provisionable_type=lab_provision.provisionable_type,
            provisionable_id=lab_provision.provisionable_id,
            action=lab_provision.action,
            status=lab_provision.status,
            lab_id=lab_provision.lab_id,

            budget_id=lab_provision.budget_id,
            purchase=purchase,
            requested_by_id=lab_provision.requested_by_id,
            requested_at=lab_provision.requested_at,
            all_requests=lab_provision.all_requests,
            is_rejected=lab_provision.is_rejected,
            rejected_at=lab_provision.rejected_at,
            rejected_by_id=lab_provision.rejected_by_id,
            all_rejections=lab_provision.all_rejections,
            is_denied=lab_provision.is_denied,
            denied_at=lab_provision.denied_at,
            denied_by_id=lab_provision.denied_by_id,

            is_approved=lab_provision.is_approved,
            approved_at=lab_provision.approved_at,
            approved_by_id=lab_provision.approved_by_id,

            is_purchased=lab_provision.is_purchased,
            purchased_at=lab_provision.purchased_at,
            purchased_by_id=lab_provision.purchased_by_id,

            is_completed=lab_provision.is_completed,
            completed_at=lab_provision.completed_at,
            completed_by_id=lab_provision.completed_by_id,

            is_cancelled=lab_provision.is_cancelled,
            cancelled_at=lab_provision.cancelled_at,
            cancelled_by_id=lab_provision.cancelled_by_id,

            is_finalised=lab_provision.is_finalised,
            finalised_at=lab_provision.finalised_at,
            finalised_by_id=lab_provision.finalised_by_id,

            **kwargs
        )

    @classmethod
    async def from_model(cls, model: LabProvision):
        try:
            detail_cls = __provision_detail_types[model.action]
        except KeyError:
            raise TypeError(f"provision {model.action} has no registered detail type")

        return await detail_cls._from_lab_provision(
            model,
            action=model.action,
            action_params=model.action_params
        )


class LabProvisionIndexPage(ModelIndexPage[LabProvision, LabProvisionDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: LabProvision):
        return await LabProvisionDetail.from_model(item)


class LabProvisionCreateRequest(
    ModelCreateRequest[LabProvision[TProvisionable, TParams]],
    Generic[TProvisionable, TParams],
):
    __deps__ = {
        "db": Depends(get_db),
        "current_user": Depends(get_current_authenticated_user),
    }

    # The ID of the provision, if resubmission is posted to the original endpoint.
    provision_id: UUID | None = None

    action: str
    lab: UUID

    purchase: PurchaseOrderCreate
    note: str

    @abstractmethod
    async def _do_create_lab_provision(
        self,
        db: LocalSession,
        action: str,
        *,
        lab: Lab,
        budget: Budget | None,
        estimated_cost: float,
        purchase_url: str | None,
        purchase_instructions: str,
        current_user: User,
        note: str,
        **kwargs
    ) -> LabProvision[TProvisionable, Any]: ...

    async def do_create(
        self, db: LocalSession, current_user: User | None = None, **kwargs
    ) -> LabProvision[TProvisionable, TParams]:
        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")

        if self.provision_id is not None:
            provision = await LabProvision.get_by_id(db, self.provision_id)
            return await self.do_update(provision, current_user=current_user, **kwargs)

        lab = await Lab.get_by_id(db, self.lab)
        budget = await Budget.get_by_id(db, self.purchase.budget)

        return await self._do_create_lab_provision(
            db,
            self.action,
            current_user=current_user,
            budget=budget,
            purchase_url=self.purchase.url,
            estimated_cost=self.purchase.estimated_cost,
            purchase_instructions=self.purchase.instructions,
            lab=lab,
            note=self.note,
            **kwargs
        )

    # Resubmit the request
    async def do_update(
        self, provision: LabProvision[TProvisionable, TParams], current_user: User | None = None
    ) -> LabProvision[TProvisionable, TParams]:
        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")

        return await provision.resubmit(
            by=current_user,
            note=self.note
        )



class LabProvisionRejectionRequest(ModelUpdateRequest[LabProvision]):
    method: Literal['reject']
    note: str

    async def do_update(
        self, model: LabProvision, current_user: User | None = None, **kwargs
    ) -> LabProvision:
        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.reject(by=current_user, note=self.note)


class LabProvisionDenialRequest(ModelUpdateRequest[LabProvision]):
    method: Literal['deny']
    note: str

    async def do_update(
        self, model: LabProvision, current_user: User | None = None, **kwargs
    ) -> LabProvision:
        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.deny(by=current_user, note=self.note)


class LabProvisionApprovalRequest(ModelUpdateRequest[LabProvision]):
    method: Literal['approve']
    note: str

    async def do_update(
        self, model: LabProvision, current_user: User | None = None, **kwargs
    ) -> LabProvision:

        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.approve(current_user, note=self.note)


class LabProvisionPurchaseRequest(ModelUpdateRequest[LabProvision]):
    method: Literal['purchase']
    note: str

    async def do_update(
        self, model: LabProvision, current_user: User | None = None, **kwargs
    ) -> LabProvision:

        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.mark_as_purchased(by=current_user, note=self.note)


class LabProvisionCompleteRequest(ModelUpdateRequest[LabProvision]):
    method: Literal['complete']
    note: str

    async def do_update(
        self, model: LabProvision, current_user: User | None = None, **kwargs
    ) -> LabProvision:
        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.complete(current_user, note=self.note)

class LabProvisionCancelRequest(ModelUpdateRequest[LabProvision]):
    method: Literal['cancel']
    note: str

    async def do_update(
        self, model: LabProvision, current_user: User | None = None, **kwargs
    ):
        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.cancel(current_user, cancelled_note=self.note)

LabProvisionRequest = Union[
    LabProvisionCreateRequest, # Resubmission
    LabProvisionRejectionRequest,
    LabProvisionDenialRequest,
    LabProvisionPurchaseRequest,
    LabProvisionCompleteRequest,
    LabProvisionCancelRequest
]
