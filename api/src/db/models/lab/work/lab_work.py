from __future__ import annotations

from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Any, ClassVar, Generic, Self, TypeVar
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr

from db import LocalSession, local_object_session
from db.models.base import Base
from db.models.base.base import model_id
from db.models.base.errors import ModelException
from db.models.base.state import TransitionMeta
from db.models.fields import uuid_pk
from db.models.user import User

from .work_status import (
    WORK_STATUS_ENUM,
    WORK_STATUS_TRANSITION,
    WorkStatus,
    WorkStatusError,
    WorkStatusTransition,
)

if TYPE_CHECKING:
    from ..lab import Lab

_work_order_types: dict[str, type[LabWorkOrder]] = {}

class WorkOrderTypeError(ModelException):
    pass

class LabWorkOrder(Base):
    __abstract__ = True
    __work_order_type__: ClassVar[str]

    def __init_subclass__(cls, **kwargs):
        work_order_type = getattr(cls, '__work_order_type__', None)
        if work_order_type:
            if work_order_type in _work_order_types:
                raise TypeError('work order types must be unique')

            if any(
                issubclass(v, cls)
                for v in _work_order_types.values()
            ):
                raise TypeError('work order types cannot extend from each other')

            _work_order_types[work_order_type] = cls
        super().__init_subclass__(**kwargs)

    lab_id: Mapped[UUID] = mapped_column(ForeignKey('lab.id'))

    @declared_attr
    def lab(self) -> Mapped[Lab | None]:
        return relationship(Lab)

    estimated_start_date: Mapped[date | None] = mapped_column(postgresql.DATE, nullable=True, default=None)
    has_multiple_days: Mapped[bool] = mapped_column(postgresql.BOOLEAN, default=False)

    estimated_end_date: Mapped[date | None] = mapped_column(postgresql.DATE, nullable=True, default=None)

    description: Mapped[str] = mapped_column(postgresql.TEXT, default='')

    work_id: Mapped[UUID | None] = mapped_column(ForeignKey("lab_work.id"), nullable=True, default=None)

    @declared_attr
    def work(self) -> Mapped[LabWork | None]:
        return relationship(LabWork)

    async def get_or_create_work(self) -> LabWork:
        db = local_object_session(self)
        if self.work_id is None:
            self.work = LabWork(self)
            await self.save()
        return await self.awaitable_attrs.work


    created_by_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    @declared_attr
    def created_by(cls) -> Mapped[User]:
        return relationship(User, foreign_keys=[cls.created_by_id])

async def get_work_order_for_type_and_id(db: LocalSession, type: str, id: UUID):
    try:
        py_type = _work_order_types[type]
        return await py_type.get_by_id(db, id)
    except KeyError:
        raise WorkOrderTypeError(f'no work order type {type}')


class LabWork(Base):
    """
    Represents a single action performed by one of the lab staff
    in order to complete a provision.
    """
    __tablename__ = "lab_work"

    work_order_type: Mapped[str] = mapped_column(postgresql.VARCHAR(64), index=True)
    work_order_id: Mapped[UUID] = mapped_column(postgresql.UUID, index=True, unique=True)

    @property
    async def work_order(self) -> LabWorkOrder:
        return await get_work_order_for_type_and_id(
            local_object_session(self), self.work_order_type, self.work_order_id
        )

    id: Mapped[uuid_pk] = mapped_column()

    status: Mapped[WorkStatus] = mapped_column(
        WORK_STATUS_ENUM, default=WorkStatus.CREATED
    )

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    @property
    def start_date(self) -> date | None:
        if self.commencement:
            return self.commencement["at"].date()
        return None

    @property
    def end_date(self) -> date | None:
        if self.completion:
            return self.completion["at"].date()
        return None

    creation: Mapped[TransitionMeta] = mapped_column(
        WORK_STATUS_TRANSITION(WorkStatus.CREATED)
    )

    def __init__(
        self, work_order: LabWorkOrder, **kwargs
    ):
        self.work_order_type = work_order.__work_order_type__
        self.work_order_id = work_order.id

        self.id = uuid4()
        self.status = WorkStatus.CREATED
        self.creation = self.__mk_status_metadata(
            WorkStatus.CREATED, work_order.created_by_id, note=f'from work order {work_order.id!s}'
        )

        self.lab_id = work_order.lab_id

        super().__init__(**kwargs)

    # The associated transition is ready
    provision_ready: Mapped[TransitionMeta | None] = mapped_column(
        WORK_STATUS_TRANSITION(WorkStatus.READY), nullable=True, default=None
    )

    async def mark_as_ready(self, marked_by: User, note: str):
        if not self.is_ready:
            self.status = WorkStatus.READY
            self.provision_ready = self.__mk_status_metadata(
                WorkStatus.READY, marked_by, note
            )
            self = await self.save()
        return self

    @property
    def is_ready(self):
        return self.provision_ready is not None

    commencement: Mapped[TransitionMeta | None] = mapped_column(
        WORK_STATUS_TRANSITION(WorkStatus.COMMENCED), nullable=True
    )

    @property
    def is_commenced(self):
        return self.commencement is not None

    async def commence(self, by: User, *, note: str) -> Self:
        if self.status != WorkStatus.READY:
            raise WorkStatusError(
                self.status, WorkStatus.COMMENCED, "associated provision not ready"
            )

        self.status = WorkStatus.COMMENCED
        self.commencement = self.__mk_status_metadata(WorkStatus.COMMENCED, by, note)
        return await self.save()

    completion: Mapped[WorkStatusTransition | None] = mapped_column(
        WORK_STATUS_TRANSITION(WorkStatus.COMPLETED), nullable=True, default=None
    )

    @property
    def is_completed(self):
        return bool(self.completion)

    async def complete(self, completed_by: User, *, note: str):
        if self.status == WorkStatus.READY:
            self = await self.commence(completed_by, note=note)
        if self.status != WorkStatus.COMMENCED:
            raise WorkStatusError(
                self.status,
                WorkStatus.COMPLETED,
                "Can only completed a ready or commenced work",
            )

        self.status = WorkStatus.COMPLETED
        self.completion = self.__mk_status_metadata(
            WorkStatus.COMPLETED, by=completed_by, note=note
        )
        return await self.save()

    @property
    def is_pending(self):
        return not self.is_completed

    def __mk_status_metadata(
        self, status: WorkStatus, by: User | UUID, note: str
    ) -> WorkStatusTransition:
        return {
            "work_id": self.id,
            "status": status,
            "at": datetime.now(tz=timezone.utc),
            "by_id": model_id(by),
            "note": note,
        }
