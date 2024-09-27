from __future__ import annotations

from abc import abstractmethod
import collections
import dataclasses
from datetime import datetime, timezone, tzinfo
from typing import TYPE_CHECKING, Any, Awaitable, ClassVar, Collection, Generic, Iterable, Self, TypeVar, TypedDict
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Select, insert, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from db import LocalSession, local_object_session
from db.models.base import Base, model_id
from db.models.base.errors import ModelException
from db.models.fields import uuid_pk

from db.models.user import User
from db.models.uni.funding import Funding, Budget, Purchase, PurchaseOrder

from ..lab import Lab
from ..work import LabWork, LabWorkOrder

from .errors import (
    ProvisionAlreadyFinalised,
    UnapprovedProvision,
    UnpurchasedProvision,
)
from .provisionable import Provisionable, get_provisionable_type
from .provision_status import (
    PROVISION_STATUS_ENUM,
    PROVISION_STATUS_TRANSITION,
    ProvisionStatusError,
    ProvisionTransition,
    _provision_transition_from_json,
    _provision_transition_to_json,
    ProvisionStatus,
)

class ProvisionType:
    name: str

__provision_types__: dict[str, ProvisionType] = {}

class ProvisionTypeError(Exception):
    def __init__(self, provision_type: str):
        super().__init__(f'unknown provision type: {provision_type}')

def provision_type(provision_type: str | ProvisionType) -> ProvisionType:
    if isinstance(provision_type, ProvisionType):
        return provision_type
    try:
        name_or_dict = __provision_types__[provision_type]
    except KeyError:
        raise ProvisionTypeError(provision_type)
    return name_or_dict

class ProvisionActionError(ModelException):
    def __init__(self, type: str | ProvisionType, action: str):
        self.type = provision_type(type)
        self.action = action
        super().__init__(f'Unrecognised action for provision type {self.type.name} {action}')


TProvisionable = TypeVar("TProvisionable", bound=Provisionable, covariant=True)
TParams = TypeVar("TParams")

class LabProvision(
    PurchaseOrder,
    LabWorkOrder,
    Base,
    Generic[TProvisionable, TParams]
):
    """
    A lab provision represents a plan to change some part of the
    lab infrastructure.
    """

    __tablename__ = "lab_provision"
    id: Mapped[uuid_pk] = mapped_column()

    # The action being performed by this provision.
    action: Mapped[str] = mapped_column(psql.VARCHAR(64))
    # A json object containing parameters for this provision
    action_params_json: Mapped[dict[str, Any]] = mapped_column(psql.JSON, server_default="{}")

    @property
    def action_params(self) -> TParams:
        p_type = get_provisionable_type(self.provisionable_type)
        action = p_type.actions[self.action]
        return action.from_json(self.action_params_json)

    status: Mapped[ProvisionStatus] = mapped_column(PROVISION_STATUS_ENUM)

    # The target of the provision. Can be any Provisionable
    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))

    lab: Mapped[Lab] = relationship()

    provisionable_type: Mapped[str] = mapped_column(psql.VARCHAR(64))
    provisionable_id: Mapped[UUID] = mapped_column(psql.UUID)

    async def get_provisionable(self):
        db = local_object_session(self)
        py_type = get_provisionable_type(self.provisionable_type).py_type
        return await py_type.get_by_id(db, self.provisionable_id)

    previous_requests: Mapped[list[ProvisionTransition]] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.REQUESTED, repeatable=True)
    )

    requested_at: Mapped[datetime] = mapped_column(psql.TIMESTAMP(timezone=True))
    requested_by_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    requested_note: Mapped[str] = mapped_column(psql.TEXT)

    def __init__(
        self,
        provisionable: TProvisionable,
        *,
        action: str,
        action_params: TParams,
        lab: Lab | UUID,
        budget: Budget,
        estimated_cost: float,
        purchase_url: str | None,
        purchase_instructions: str,

        note: str,
        requested_by: User,
    ):
        from db.models.lab.work import LabWork

        self.id = uuid4()
        self.status = ProvisionStatus.REQUESTED

        p_type = get_provisionable_type(provisionable)
        self.provisionable_type = p_type.name
        self.provisionable_id = provisionable.id

        try:
            action_type = p_type.actions[action]
        except KeyError:
            raise ProvisionActionError(p_type.name, action)

        self.action = action
        self.action_params_json = action_type.to_json(action_params)
        self.lab_id = model_id(lab)

        if budget.lab_id != self.lab_id:
            raise ValueError("Budget must be for same lab")

        self.budget_id = budget.id
        self.estimated_cost = estimated_cost
        self.purchase_url = purchase_url
        self.purchase_instructions = purchase_instructions

        self._set_request(requested_by, note=note, initial=True)

        return super().__init__()

    @property
    def initial_request(self) -> ProvisionTransition:
        return self.all_requests[0]

    @property
    def request(self) -> ProvisionTransition:
        return ProvisionTransition(
            status=ProvisionStatus.REQUESTED,
            provision_id=self.id,
            at=self.requested_at,
            by_id=self.requested_by_id,
            note=self.requested_note,
        )

    @property
    def all_requests(self):
        return [*self.previous_requests, self.request]

    def _set_request(self, by: User, *, note: str = "", initial: bool = False):
        if not initial:
            self.previous_requests.insert(0, self.request)

        self.requested_at = datetime.now(tz=timezone.utc)
        self.requested_by_id = by.id
        self.requested_note = note

    all_rejections: Mapped[list[ProvisionTransition]] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.REJECTED, repeatable=True)
    )

    @property
    def rejection(self) -> ProvisionTransition | None:
        if self.is_approved or self.is_denied:
            return None
        return self.all_rejections[0] if self.all_rejections else None

    @property
    def is_rejected(self):
        return bool(self.rejection)

    @property
    def rejected_at(self) -> datetime | None:
        return self.rejection['at'] if self.rejection else None

    @property
    def rejected_by_id(self) -> UUID | None:
        return self.rejection['by_id'] if self.rejection else None

    async def reject(self, by: User, note: str) -> Self:
        if self.status != ProvisionStatus.REQUESTED:
            raise ProvisionStatusError(
                self.status,
                ProvisionStatus.REJECTED,
                "can only reject a submitted request",
            )
        rejection = self.__mk_status_metadata(ProvisionStatus.REJECTED, by, note=note)
        self.all_rejections.insert(0, rejection)

        return await self.__save()

    async def resubmit(self, by: User, note: str) -> Self:
        if self.status not in {ProvisionStatus.REJECTED, ProvisionStatus.APPROVED}:
            raise ProvisionStatusError(
                self.status,
                ProvisionStatus.REQUESTED,
                "can only resubmit a rejected provision"
            )

        self._set_request(by, note=note, initial=False)
        return await self.__save()

    approval: Mapped[ProvisionTransition | None] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.APPROVED)
    )

    @property
    def is_approved(self):
        return bool(self.approval)

    @property
    def approved_at(self):
        return self.approval['at'] if self.approval else None

    @property
    def approved_by_id(self):
        return self.approval['by_id'] if self.approval else None

    async def approve(self, by: User, *, note: str) -> Self:
        if self.status not in {ProvisionStatus.REQUESTED, ProvisionStatus.REJECTED}:
            raise ProvisionStatusError(
                self.status,
                ProvisionStatus.APPROVED,
                "can only approve a requested or rejected provision",
            )
        self.approval = self.__mk_status_metadata(
            ProvisionStatus.APPROVED, by, note=note
        )

        purchase = await self.get_or_create_purchase()
        if purchase:
            self.purchase = await purchase.mark_as_ready(
                by, note="provision order approved"
            )

        if self.is_work_ready():
            self.work = await self.work.mark_as_ready(
                by, note="approved no purchase required"
            )

        return await self.__save()


    denial: Mapped[ProvisionTransition | None] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.DENIED)
    )

    @property
    def is_denied(self):
        return bool(self.denial)

    @property
    def denied_at(self):
        return self.denial['at'] if self.denial else None

    @property
    def denied_by_id(self):
        return self.denial['by_id'] if self.denial else None

    async def deny(self, by: User, *, note: str) -> Self:
        if not self.status not in {ProvisionStatus.REQUESTED, ProvisionStatus.REJECTED}:
            raise ProvisionStatusError(
                self.status,
                ProvisionStatus.DENIED,
                "Can only deny a requested or rejected provision",
            )

        self.denial = self.__mk_status_metadata(ProvisionStatus.DENIED, by, note=note)
        return await self.__save()

    requisition: Mapped[ProvisionTransition | None] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.PURCHASED)
    )

    @property
    def is_purchase_required(self):
        return self.purchase_id is not None

    async def has_pending_purchase(self):
        purchase: Purchase | None = await self.awaitable_attrs.purchase
        return bool(purchase) and not purchase.is_pending

    @property
    def is_purchased(self):
        return self.requisition is not None

    @property
    def purchased_at(self):
        return self.requisition['at'] if self.requisition else None

    @property
    def purchased_by_id(self):
        return self.requisition['by_id'] if self.requisition else None

    async def mark_as_purchased(self, by: User, *, note: str) -> Self:
        if self.status != ProvisionStatus.APPROVED:
            raise ProvisionStatusError(
                self.status,
                ProvisionStatus.APPROVED,
                "can only purchase an approved provision",
            )
        self.requisition = self.__mk_status_metadata(
            ProvisionStatus.PURCHASED, by, note=note
        )

        if self.is_work_ready():
            self.work = await self.work.mark_as_ready(by, "after requisition purhcased")

        return await self.__save()

    work_id: Mapped[UUID] = mapped_column(ForeignKey("lab_work.id"))
    work: Mapped[LabWork] = relationship()

    def is_work_ready(self):
        return self.is_purchased or (self.is_approved and not self.is_purchase_required)

    completion: Mapped[ProvisionTransition | None] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.COMPLETED)
    )

    @property
    def is_completed(self):
        return self.completion is not None

    @property
    def completed_at(self):
        return self.completion['at'] if self.completion else None

    @property
    def completed_by_id(self) -> UUID | None:
        return self.completion['by_id'] if self.completion else None

    async def complete(self, by: User, note: str):
        if self.status == ProvisionStatus.APPROVED:
            if await self.has_pending_purchase():
                raise ProvisionStatusError(
                    self.status,
                    ProvisionStatus.COMPLETED,
                    "provision requires purchase",
                )
        elif self.status != ProvisionStatus.PURCHASED:
            raise ProvisionStatusError(
                self.status,
                ProvisionStatus.COMPLETED,
                "can only complete an approved or purchased provision",
            )
        self.completion = self.__mk_status_metadata(
            ProvisionStatus.COMPLETED, by, note=note
        )
        return await self.__save()

    @property
    def is_finalised(self):
        return self.is_denied or self.is_completed or self.is_cancelled

    @property
    def finalised_at(self) -> datetime | None:
        if self.is_denied:
            return self.denied_at
        elif self.is_completed:
            return self.completed_at
        elif self.is_cancelled:
            return self.cancelled_at
        else:
            return None

    @property
    def finalised_by_id(self) -> UUID | None:
        if self.is_denied:
            return self.denied_by_id
        elif self.is_completed:
            return self.completed_by_id
        elif self.is_cancelled:
            return self.cancelled_by_id
        else:
            return None

    @property
    def is_pending(self):
        return not self.is_finalised

    cancellation: Mapped[ProvisionTransition | None] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.CANCELLED)
    )

    @property
    def is_cancelled(self):
        return bool(self.cancellation)

    @property
    def cancelled_at(self):
        return self.cancellation['at'] if self.cancellation else None

    @property
    def cancelled_by_id(self):
        return self.cancellation['by_id'] if self.cancellation else None

    async def cancel(
        self,
        cancelled_by: User | UUID,
        cancelled_note: str,
        using: LocalSession | None = None,
    ) -> Self:
        if self.is_finalised:
            raise ProvisionAlreadyFinalised(self, "cancelled")

        using = using or local_object_session(self)

        if self.is_purchased:
            funding = await self.awaitable_attrs.funding
            await funding.cancel_purchase(self.mark_as_purchased, using=using)

        self.cancelled_status_metadata = self.__mk_status_metadata(
            status=ProvisionStatus.COMPLETED,
            by=cancelled_by,
            note=cancelled_note,
        )
        return await self.__save()

    def __mk_status_metadata(self, status: ProvisionStatus, by: User | UUID, note: str):
        return ProvisionTransition(
            provision_id=self.id,
            status=status,
            at=datetime.now(tz=timezone.utc),
            by_id=model_id(by),
            note=note,
        )

    async def __save(self):
        db = local_object_session(self)
        db.add(self)
        await db.commit()
        return self

def query_lab_provisions(
    provisionable_type: str | None = None,
    provisionable_id: UUID | None = None,
    action: str | None = None,
    only_pending: bool = False
) -> Select[tuple[LabProvision[Any, Any]]]:
    where_clauses = []

    if provisionable_type:
        where_clauses.append(
            LabProvision.provisionable_type == provisionable_type
        )

    if provisionable_id:
        where_clauses.append(
            LabProvision.provisionable_id == provisionable_id
        )

    if action:
        where_clauses.append(
            LabProvision.action == action
        )

    if only_pending:
        where_clauses.append(
            LabProvision.status.in_([s for s in ProvisionStatus if not s.is_final])
        )

    return select(LabProvision).where(*where_clauses).order_by(LabProvision.created_at, 'reversed')