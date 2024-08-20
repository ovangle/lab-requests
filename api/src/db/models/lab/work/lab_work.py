from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Self
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.models.base import Base
from db.models.base.state import TransitionMeta
from db.models.fields import uuid_pk
from db.models.lab.work.work_status import (
    WORK_STATUS_ENUM,
    WORK_STATUS_TRANSITION,
    WorkStatus,
    WorkStatusError,
    WorkStatusTransition,
)
from db.models.user import User

if TYPE_CHECKING:
    from ..lab import Lab
    from ..provisionable import LabProvision


class LabWork(Base):
    __tablename__ = "lab_work"

    id: Mapped[uuid_pk] = mapped_column()

    status: Mapped[WorkStatus] = mapped_column(
        WORK_STATUS_ENUM, default=WorkStatus.CREATED
    )

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    provision_id: Mapped[UUID] = mapped_column(ForeignKey("lab_provision.id"))
    provision: Mapped[LabProvision[Any]] = relationship()

    creation: Mapped[TransitionMeta] = mapped_column(
        WORK_STATUS_TRANSITION(WorkStatus.CREATED)
    )

    def __init__(
        self, provision: LabProvision[Any], created_by: User, note: str, **kwargs
    ):
        super().__init__(**kwargs)

        self.provision_id = provision.id
        self.creation = self.__mk_status_metadata(
            WorkStatus.CREATED, created_by, note=note
        )

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
        self, status: WorkStatus, by: User, note: str
    ) -> WorkStatusTransition:
        return {
            "work_id": self.id,
            "status": status,
            "at": datetime.now(tz=timezone.utc),
            "by_id": by.id,
            "note": note,
        }
