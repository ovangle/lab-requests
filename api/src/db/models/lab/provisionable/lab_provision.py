from __future__ import annotations

from abc import abstractmethod
import collections
import dataclasses
from datetime import datetime, timezone, tzinfo
from typing import TYPE_CHECKING, Any, Awaitable, ClassVar, Collection, Generic, Iterable, Self, TypeVar
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, insert
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from db import LocalSession, local_object_session
from db.models.base import Base, model_id
from db.models.base.errors import ModelException
from db.models.fields import uuid_pk

from db.models.user import User
from db.models.research.funding import ResearchFunding, ResearchBudget, ResearchPurchase, ResearchPurchaseOrder

from ..lab import Lab
from ..work import LabWork, LabWorkOrder

from .errors import (
    ProvisionAlreadyFinalised,
    UnapprovedProvision,
    UnpurchasedProvision,
)
from .provisionable import Provisionable
from .provision_status import (
    PROVISION_STATUS_ENUM,
    PROVISION_STATUS_TRANSITION,
    ProvisionStatusError,
    ProvisionTransition,
    _provision_transition_from_json,
    _provision_transition_to_json,
    ProvisionStatus,
)

TProvisionable = TypeVar("TProvisionable", bound=Provisionable, covariant=True)

@dataclasses.dataclass()
class ProvisionType:
    name: str

    dataclasses.KW_ONLY

    actions: set[str] = dataclasses.field(default_factory=set)

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


class LabProvision(
    ResearchPurchaseOrder,
    LabWorkOrder,
    Base,
    Generic[TProvisionable]
):
    """
    A lab provision represents a plan to change some part of the
    lab infrastructure.
    """

    __tablename__ = "lab_provision"
    __provision_type__: ClassVar[ProvisionType]
    __auto_approve__: ClassVar[bool] = False

    def __init_subclass__(cls, **kw: Any) -> None:
        if not hasattr(cls, "__provision_type__"):
            is_abstract = getattr(cls, "__abstract__", False)
            if not is_abstract:
                raise TypeError(
                    "LabProvision subclass must declare a __provision_type__"
                )
        else:
            provision_type = getattr(cls, '__provision_type__')
            if provision_type.name in __provision_types__:
                raise ModelException("Name must be unique amongst provision types")
            setattr(cls, '__purchase_order_type__', provision_type.name)

            if not hasattr(cls, "__mapper_args__"):
                setattr(cls, "__mapper_args__", {})

            cls.__mapper_args__.update(
                polymorphic_on="type", polymorphic_identity=cls.__provision_type__.name
            )

        return super().__init_subclass__(**kw)

    id: Mapped[uuid_pk] = mapped_column()

    # Polymorphic type of this provision. Different provisionables have different provision types. Maps to a unique python type
    type: Mapped[str] = mapped_column(psql.VARCHAR(64))
    action: Mapped[str] = mapped_column(psql.VARCHAR(64))

    status: Mapped[ProvisionStatus] = mapped_column(PROVISION_STATUS_ENUM)

    # The target of the provision. Can be any Provisionable

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))

    lab: Mapped[Lab] = relationship()

    @property
    @abstractmethod
    def target_id(self) -> UUID: ...

    previous_requests: Mapped[list[ProvisionTransition]] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.REQUESTED, repeatable=True)
    )

    requested_at: Mapped[datetime] = mapped_column(psql.TIMESTAMP(timezone=True))
    requested_by_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    requested_note: Mapped[str] = mapped_column(psql.TEXT)

    def __init__(
        self,
        action: str,
        *,
        lab: Lab,
        budget: ResearchBudget | None = None,
        note: str,
        requested_by: User,
        **kwargs
    ):
        from db.models.lab.work import LabWork
        from db.models.research.funding import ResearchPurchase

        provision_type = type(self).__provision_type__
        self.type = provision_type.name

        self.id = uuid4()
        self.status = ProvisionStatus.REQUESTED

        if action not in provision_type.actions:
            raise ProvisionActionError(provision_type, action)
        self.action = action
        self.lab_id = lab.id

        self.budget_id = budget.id if budget else None

        self._set_request(requested_by, note=note, initial=True)

        return super().__init__(**kwargs)

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
                "can only reject a re-submitted request",
            )
        rejection = self.__mk_status_metadata(ProvisionStatus.REJECTED, by, note=note)
        self.all_rejections.insert(0, rejection)

        return await self.save()

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

        return await self.save()

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
        return await self.save()

    requisition: Mapped[ProvisionTransition | None] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.PURCHASED)
    )

    @property
    def is_purchase_required(self):
        return self.purchase_id is not None

    async def has_pending_purchase(self):
        purchase: ResearchPurchase | None = await self.awaitable_attrs.purchase
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

        return await self.save()

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
    def completed_by_id(self):
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
        return await self.save()

    @property
    def is_finalised(self):
        return self.is_denied or self.is_completed or self.is_cancelled

    @property
    def finalised_at(self) -> datetime | None:
        if self.is_denied:
            return self.denied_At
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
            return self.completed_by_id,
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
        return await self.save()

    def __mk_status_metadata(self, status: ProvisionStatus, by: User | UUID, note: str):
        return ProvisionTransition(
            provision_id=self.id,
            status=status,
            at=datetime.now(tz=timezone.utc),
            by_id=model_id(by),
            note=note,
        )
