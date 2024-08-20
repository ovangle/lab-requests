from __future__ import annotations

from abc import abstractmethod
from datetime import datetime, timezone, tzinfo
from typing import TYPE_CHECKING, Any, Awaitable, ClassVar, Generic, Self, TypeVar
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from db import LocalSession, local_object_session
from db.models.base import Base, model_id
from db.models.fields import uuid_pk

from db.models.user import User

if TYPE_CHECKING:
    from db.models.research.funding import ResearchFunding
    from db.models.lab.work.lab_work import LabWork

from ..lab import Lab

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

TProvisionable = TypeVar("TProvisionable", bound=Provisionable)


class LabProvision(Base, Generic[TProvisionable]):
    """
    A lab provision represents a plan to change some part of the
    lab infrastructure.
    """

    __tablename__ = "lab_provision"
    __provision_type__: ClassVar[str]
    __auto_approve__: ClassVar[bool] = False

    def __init_subclass__(cls, **kw: Any) -> None:
        if not hasattr(cls, "__provision_type__"):
            is_abstract = getattr(cls, "__abstract__", False)
            if not is_abstract:
                raise TypeError(
                    "LabProvision subclass must declare a __provision_type__"
                )
        else:

            if not hasattr(cls, "__mapper_args__"):
                setattr(cls, "__mapper_args__", {})

            cls.__mapper_args__.update(
                polymorphic_on="type", polymorphic_identity=cls.__provision_type__
            )

        return super().__init_subclass__(**kw)

    id: Mapped[uuid_pk] = mapped_column()

    # Represents the named type of the provision.
    type: Mapped[str] = mapped_column(psql.VARCHAR(64))
    status: Mapped[ProvisionStatus] = mapped_column(PROVISION_STATUS_ENUM)

    # The target of the provision. Can be any Provisionable

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))

    lab: Mapped[Lab] = relationship()

    # The funding source which will be used to purchase the provision
    funding_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("research_funding.id"), default=None
    )
    funding: Mapped[ResearchFunding] = relationship()

    @property
    @abstractmethod
    def target_id(self) -> UUID: ...

    estimated_cost: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)
    purchase_cost: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)

    created_by_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    created_by: Mapped[User] = relationship()

    previous_requests: Mapped[list[ProvisionTransition]] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.REQUESTED, repeatable=True)
    )

    requested_at: Mapped[datetime] = mapped_column(psql.TIMESTAMP(timezone=True))
    requested_by_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    requested_note: Mapped[str] = mapped_column(psql.TEXT)

    def __init__(self, *, note: str, requested_by: User, **kwargs):
        self.id = uuid4()
        self.status = ProvisionStatus.REQUESTED
        self.type = type(self).__provision_type__

        self._set_request(requested_by, note=note, initial=True)
        self._work = LabWork(self, requested_by, f"created by provision {self.id}")

        return super().__init__(**kwargs)

    @property
    def request(self) -> ProvisionTransition:
        return ProvisionTransition(
            status=ProvisionStatus.REQUESTED,
            provision_id=self.id,
            at=self.requested_at,
            by_id=self.created_by_id,
            note=self.requested_note,
        )

    @property
    def requests(self):
        return [*self.previous_requests, self.request]

    def _set_request(self, by: User, *, note: str = "", initial: bool = False):
        if not initial:
            self.previous_requests.insert(0, self.request)

        self.requested_at = datetime.now(tz=timezone.utc)
        self.requested_by_id = by.id
        self.requested_note = note

    rejections: Mapped[list[ProvisionTransition]] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.REJECTED, repeatable=True)
    )

    @property
    def current_rejection(self) -> ProvisionTransition | None:
        if self.is_approved or self.is_denied:
            return None
        return self.rejections[0] if self.rejections else None

    async def reject(self, by: User, note: str) -> Self:
        if self.status != ProvisionStatus.REQUESTED:
            raise ProvisionStatusError(
                self.status,
                ProvisionStatus.REJECTED,
                "can only reject a re-submitted request",
            )
        rejection = self.__mk_status_metadata(ProvisionStatus.REJECTED, by, note=note)
        self.rejections.insert(0, rejection)

        return await self.save()

    approval: Mapped[ProvisionTransition | None] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.APPROVED)
    )

    @property
    def is_approved(self):
        return bool(self.approval)

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
        if self.funding_id is None:
            return False
        return self.estimated_cost >= 0

    async def has_pending_purchase(self):
        raise NotImplementedError

    @property
    def is_purchased(self):
        return self.requisition is not None

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
        return self.is_completed or self.is_cancelled

    @property
    def is_pending(self):
        return not self.is_finalised

    cancellation: Mapped[ProvisionTransition | None] = mapped_column(
        PROVISION_STATUS_TRANSITION(ProvisionStatus.CANCELLED)
    )

    @property
    def is_cancelled(self):
        return bool(self.cancellation)

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
