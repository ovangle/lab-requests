from datetime import datetime, timezone
from typing import ClassVar, Generic, Self, TypeVar
from uuid import UUID, uuid4

from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from sqlalchemy.dialects import postgresql

from db import local_object_session
from db.models.fields import uuid_pk
from db.models.base.base import Base, model_id
from db.models.lab.lab import Lab
from db.models.user import User
from db.models.lab.provisionable import LabProvision

from .allocatable import Allocatable
from .allocation_status import (
    ALLOCATION_STATUS_TRANSITION,
    AllocationStatus,
    ALLOCATION_STATUS_ENUM,
    AllocationStatusError,
    AllocationStatusTransition,
)


TAllocatable = TypeVar("TAllocatable", bound=Allocatable)


lab_allocation_setup_provisions = Table(
    "lab_allocation_setup_provisions",
    Base.metadata,
    Column("allocation_id", ForeignKey("lab_allocation.id"), primary_key=True),
    Column("provision_id", ForeignKey("lab_provision.id"), primary_key=True),
)

lab_allocation_teardown_provisions = Table(
    "lab_allocation_teardown_provisions",
    Base.metadata,
    Column("allocation_id", ForeignKey("lab_allocation.id"), primary_key=True),
    Column("provision_id", ForeignKey("lab_provision.id"), primary_key=True),
)


class LabAllocation(Base, Generic[TAllocatable]):
    __allocation_type__: ClassVar[str]
    __tablename__ = "lab_allocation"

    def __init_subclass__(cls, **kw) -> None:
        if not hasattr(cls, "__allocation_type__"):
            raise TypeError("LabAllocation subclass haa no __allocation_type__")
        return super().__init_subclass__(**kw)

    id: Mapped[uuid_pk] = mapped_column()
    type: Mapped[str] = mapped_column(postgresql.VARCHAR(64))

    @validates("type")
    def validate_type(self, value, key):
        if self.type:
            raise ValueError("type cannot be modified after creation")
        return value

    def __init__(self, lab: Lab, requested_by: User, requested_note: str):
        self.type = self.__allocation_type__
        self.id = uuid4()
        self.lab_id = lab.id
        self._set_request(requested_by, note=requested_note)
        super().__init__()

    status: Mapped[AllocationStatus] = mapped_column(
        ALLOCATION_STATUS_ENUM, default=AllocationStatus.REQUESTED
    )

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    async def get_allocatable(self):
        raise NotImplementedError

    request_at: Mapped[datetime] = mapped_column(postgresql.TIMESTAMP(timezone=True))
    request_by_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    request_by: Mapped[User] = relationship()
    request_note: Mapped[str] = mapped_column(postgresql.TEXT)

    @property
    def request(self):
        return AllocationStatusTransition(
            allocation_id=self.id,
            status=AllocationStatus.REQUESTED,
            at=self.request_at,
            by_id=self.request_by_id,
            note=self.request_note,
        )

    previous_requests: Mapped[list[AllocationStatusTransition]] = mapped_column(
        ALLOCATION_STATUS_TRANSITION(AllocationStatus.REQUESTED, repeatable=True),
        server_default="[]",
    )

    @property
    def requests(self):
        return [self.request, *self.previous_requests]

    def _set_request(self, request_by: User, *, note: str = ""):
        self.previous_requests = [self.request, *self.previous_requests]

        self.request_at = datetime.now(tz=timezone.utc)
        self.request_by_id = request_by.id
        self.request_note = note

    @property
    def last_requested(self):
        return self.last_requested[-1]

    async def resubmit(self, by: User, note: str) -> Self:
        # TODO: check can be submitted by the user

        if self.status not in {AllocationStatus.REJECTED, AllocationStatus.APPROVED}:
            raise AllocationStatusError(
                self.status,
                AllocationStatus.REQUESTED,
                "Can only resubmit a rejected or approved error",
            )
        self._set_request(by, note=note)
        return await self.save()

    approval: Mapped[AllocationStatusTransition | None] = mapped_column(
        ALLOCATION_STATUS_TRANSITION(AllocationStatus.APPROVED), nullable=True
    )

    async def approve(self, by: User, note: str):
        if self.status not in {AllocationStatus.REQUESTED, AllocationStatus.REJECTED}:
            raise AllocationStatusError(
                self.status,
                AllocationStatus.APPROVED,
                "can only approve a requested or rejected allocation",
            )

        self._approved = self.__allocation_status_metadata(
            AllocationStatus.APPROVED, by, note
        )

    rejections: Mapped[list[AllocationStatusTransition]] = mapped_column(
        ALLOCATION_STATUS_TRANSITION(AllocationStatus.REJECTED, repeatable=True),
        server_default="[]",
    )

    async def reject(self, by: User, note: str) -> Self:
        if self.status not in {AllocationStatus.REQUESTED, AllocationStatus.REJECTED}:
            raise AllocationStatusError(
                self.status,
                AllocationStatus.REJECTED,
                "can only reject a requested allocation",
            )

        self.rejections = [
            *self.rejections,
            self.__allocation_status_metadata(AllocationStatus.REJECTED, by, note),
        ]
        return await self.save()

    denial: Mapped[AllocationStatusTransition | None] = mapped_column(
        ALLOCATION_STATUS_TRANSITION(AllocationStatus.DENIED), nullable=True
    )

    async def deny(self, by: User, note: str) -> Self:
        """
        A denial is a strong rejection, request is closed and cannot be
        resubmitted for editing
        """

        if self.status != AllocationStatus.REQUESTED:
            raise AllocationStatusError(
                self.status,
                AllocationStatus.DENIED,
                f"Can only deny a requested allocation",
            )

        self.denial = self.__allocation_status_metadata(
            AllocationStatus.REQUESTED, by, note
        )
        return await self.save()

    setup: Mapped[AllocationStatusTransition | None] = mapped_column(
        ALLOCATION_STATUS_TRANSITION(AllocationStatus.SETUP), nullable=True
    )

    setup_provisions: Mapped[list[LabProvision]] = relationship(
        secondary=lab_allocation_setup_provisions
    )

    async def has_pending_setup_provisions(self) -> bool:
        raise NotImplementedError

    async def begin_setup(self, by: User, note: str) -> Self:
        if self.status != AllocationStatus.APPROVED:
            raise AllocationStatusError(
                self.status,
                AllocationStatus.SETUP,
                f"Can only begin setup of an approved allocation",
            )

        self._setup = self.__allocation_status_metadata(
            AllocationStatus.SETUP, by, note
        )
        return await self.save()

    prepared: Mapped[AllocationStatusTransition | None] = mapped_column(
        ALLOCATION_STATUS_TRANSITION(AllocationStatus.PREPARED), nullable=True
    )

    async def mark_as_prepared(self, by: User, note: str):
        if self.status != AllocationStatus.SETUP:
            raise AllocationStatusError(self.status, AllocationStatus.PREPARED, f"")

        self.prepared = self.__allocation_status_metadata(
            AllocationStatus.PREPARED, by, note
        )

    progress_events: Mapped[list[AllocationStatusTransition]] = mapped_column(
        ALLOCATION_STATUS_TRANSITION(AllocationStatus.IN_PROGRESS, repeatable=True),
        server_default="[]",
    )

    async def begin(self, by: User, note: str) -> Self:
        if self.status != AllocationStatus.PREPARED:
            raise AllocationStatusError(
                self.status, AllocationStatus.IN_PROGRESS, f"unprepared allocation"
            )
        self.in_progress = [
            self.__allocation_status_metadata(AllocationStatus.IN_PROGRESS, by, note)
        ]
        return await self.save()

    async def add_progress(self, by: User, note: str) -> Self:
        if self.status != AllocationStatus.IN_PROGRESS:
            raise AllocationStatusError(
                self.status, AllocationStatus.IN_PROGRESS, f"Allocation not in progress"
            )

        self.in_progress = [
            *self.in_progress,
            self.__allocation_status_metadata(AllocationStatus.IN_PROGRESS, by, note),
        ]
        return await self.save()

    completion: Mapped[AllocationStatusTransition | None] = mapped_column(
        ALLOCATION_STATUS_TRANSITION(AllocationStatus.COMPLETED), nullable=True
    )

    @property
    def is_completed(self):
        return self.completion is not None

    async def complete(self, by: User):
        if self.status != AllocationStatus.IN_PROGRESS:
            raise AllocationStatusError(
                self.status, AllocationStatus.IN_PROGRESS, f"allocation not in progress"
            )

        self.completed = self.__allocation_status_metadata(
            AllocationStatus.COMPLETED, by, note="completed"
        )

        self = await self.save()

        requires_teardown = await self.has_pending_teardown_provisions()
        if not requires_teardown:
            return await self.finalise(by, note="no teardown required")

        return self

    cancellation: Mapped[AllocationStatusTransition | None] = mapped_column(
        ALLOCATION_STATUS_TRANSITION(AllocationStatus.CANCELLED), nullable=True
    )

    @property
    def is_cancelled(self):
        return self.cancellation is not None

    async def cancel(self, by: User, note: str) -> Self:
        if not self.status.is_cancellable:
            raise AllocationStatusError(
                self.status,
                AllocationStatus.CANCELLED,
                "Source status is not cancellable",
            )

        self.cancelled = self.__allocation_status_metadata(
            AllocationStatus.CANCELLED, by, note
        )

        await self.begin_teardown(by, note="from_cancellation")
        requires_teardown = self.has_pending_teardown_provisions()

        return await self.save()

    teardown_provisions: Mapped[list[LabProvision]] = relationship(
        secondary=lab_allocation_teardown_provisions
    )

    async def begin_teardown(self, triggered_by: User, note: str) -> Self:
        teardown_provisions: list[LabProvision] = (
            await self.awaitable_attrs.teardown_provisions
        )

        for provision in teardown_provisions:
            work = await provision.get_or_create_work()

        return self

    async def has_pending_teardown_provisions(self) -> bool:
        raise NotImplementedError

    finalisation: Mapped[AllocationStatusTransition | None] = mapped_column(
        ALLOCATION_STATUS_TRANSITION(AllocationStatus.FINALIZED), nullable=True
    )

    async def finalise(self, by: User, *, note: str) -> Self:
        if self.status not in {
            AllocationStatus.COMPLETED,
            AllocationStatus.CANCELLED,
        }:
            raise AllocationStatusError(
                self.status,
                AllocationStatus.FINALIZED,
                "must be completed or cancelled",
            )

        requires_teardown = await self.has_pending_teardown_provisions()
        if requires_teardown:
            raise AllocationStatusError(
                self.status, AllocationStatus.FINALIZED, "pending teardown tasks"
            )

        self.finalisation = self.__allocation_status_metadata(
            AllocationStatus.FINALIZED, by, note
        )
        return await self.save()

    def __allocation_status_metadata(
        self, status: AllocationStatus, by: User, note: str
    ):
        return AllocationStatusTransition(
            allocation_id=self.id,
            status=status,
            at=datetime.now(tz=timezone.utc),
            by_id=model_id(by),
            note=note,
        )
