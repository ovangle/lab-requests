from abc import abstractmethod
from typing import Generic, TypeVar, override
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
from db.models.research.funding import ResearchFunding
from db.models.user import User

from ..base import (
    ModelCreateRequest,
    ModelDetail,
    ModelRequestContextError,
    ModelUpdateRequest,
)

TProvision = TypeVar("TProvision", bound=LabProvision)


class LabProvisionDetail(ModelDetail[TProvision], Generic[TProvision]):
    type: str
    status: ProvisionStatus

    lab_id: UUID
    funding_id: UUID | None

    estimated_cost: float
    purchase_cost: float

    request: ProvisionTransition
    all_requests: list[ProvisionTransition]

    current_rejection: ProvisionTransition | None
    rejections: list[ProvisionTransition]

    denial: ProvisionTransition | None
    approval: ProvisionTransition | None
    requisition: ProvisionTransition | None
    completion: ProvisionTransition | None
    cancellation: ProvisionTransition | None

    @classmethod
    async def _from_lab_provision(cls, lab_provision: LabProvision, **kwargs):
        return await cls._from_base(
            lab_provision,
            type=lab_provision.type,
            status=lab_provision.status,
            lab_id=lab_provision.lab_id,
            funding_id=lab_provision.funding_id,
            estimated_cost=lab_provision.estimated_cost,
            purchase_cost=lab_provision.purchase_cost,
            request=lab_provision.request,
            all_requests=lab_provision.requests,
            current_rejection=lab_provision.current_rejection,
            rejections=lab_provision.rejections,
            denial=lab_provision.denial,
            approval=lab_provision.approval,
            requisition=lab_provision.requisition,
            completion=lab_provision.completion,
            cancellation=lab_provision.cancellation,
            **kwargs
        )


class LabProvisionCreateRequest(
    ModelCreateRequest[TProvision],
    Generic[TProvision],
):
    __deps__ = {
        "db": Depends(get_db),
        "current_user": Depends(get_current_authenticated_user),
    }

    type: str

    lab_id: UUID
    funding_id: UUID | None = None

    estimated_cost: float | None = None

    note: str

    @abstractmethod
    async def do_create_lab_provision(
        self,
        db: LocalSession,
        type: str,
        *,
        lab: Lab,
        funding: ResearchFunding | None,
        current_user: User,
        note: str
    ) -> TProvision: ...

    async def do_create(
        self, db: LocalSession, current_user: User | None = None, **kwargs
    ) -> TProvision:
        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        lab = await Lab.get_by_id(db, self.lab_id)
        if self.funding_id:
            funding = await ResearchFunding.get_by_id(db, self.funding_id)
        else:
            funding = None
        return await self.do_create_lab_provision(
            db,
            self.type,
            current_user=current_user,
            note=self.note,
            lab=lab,
            funding=funding,
        )


class LabProvisionRejection(ModelUpdateRequest[TProvision], Generic[TProvision]):
    provision_id: UUID
    note: str

    async def do_update(
        self, model: TProvision, current_user: User | None = None, **kwargs
    ) -> TProvision:
        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.approve(by=current_user, note=self.note)


class LabProvisionDenial(ModelUpdateRequest[TProvision], Generic[TProvision]):
    provision_id: UUID
    note: str

    async def do_update(
        self, model: TProvision, current_user: User | None = None, **kwargs
    ) -> TProvision:
        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.deny(by=current_user, note=self.note)


class LabProvisionApproval(ModelUpdateRequest[TProvision], Generic[TProvision]):
    provision_id: UUID
    note: str

    async def do_update(
        self, model: TProvision, current_user: User | None = None, **kwargs
    ) -> TProvision:

        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.approve(current_user, note=self.note)


class LabProvisionPurchase(ModelUpdateRequest[TProvision], Generic[TProvision]):
    provision_id: UUID
    note: str

    async def do_update(
        self, model: TProvision, current_user: User | None = None, **kwargs
    ) -> TProvision:

        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.mark_as_purchased(by=current_user, note=self.note)


class LabProvisionComplete(ModelUpdateRequest[TProvision], Generic[TProvision]):
    provision_id: UUID
    note: str

    async def do_update(
        self, model: TProvision, current_user: User | None = None, **kwargs
    ) -> TProvision:
        if not current_user:
            raise ModelRequestContextError("Expected authenticated request context")
        return await model.complete(current_user, note=self.note)
