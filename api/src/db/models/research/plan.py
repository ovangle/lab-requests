from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Column, ForeignKey, Select, Table, UniqueConstraint, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql
from sqlalchemy_file import FileField, File
from db import LocalSession

from db.models.base.fields import uuid_pk
from db.models.lab.lab_resource import LabResource, LabResourceType
import filestore

from ..base import Base, DoesNotExist
from ..lab import LabResourceConsumer
from .funding import ResearchFunding

if TYPE_CHECKING:
    from db.models.user import User
    from db.models.lab import Lab, LabResource


class ResearchPlanDoesNotExist(DoesNotExist):
    pass


class ResearchPlanTaskDoesNotExist(DoesNotExist):
    def __init__(
        self, for_id: UUID | None = None, for_plan_index: tuple[UUID, int] | None = None
    ):
        if for_id:
            super().__init__(for_id=for_id)
        if for_plan_index:
            plan, index = for_plan_index
            msg = f"No task for plan {plan} at {index}"
            super().__init__(msg)
        raise ValueError("Either for_id or for_plan_index must be provided")


research_plan_resources = Table(
    "research_plan_resources",
    Base.metadata,
    Column("plan_id", ForeignKey("research_plan.id"), primary_key=True),
    Column("resource_id", ForeignKey("lab_resource.id"), primary_key=True),
    Column("resource_type", postgresql.VARCHAR(16)),
    Column("resource_index", postgresql.INTEGER),
)


class ResearchPlanTask(Base):
    __tablename__ = "research_plan_task"
    __table_args__ = (UniqueConstraint("plan_id", "index"),)

    id: Mapped[uuid_pk]

    plan_id: Mapped[UUID] = mapped_column(ForeignKey("research_plan.id"))
    plan: Mapped[ResearchPlan] = relationship(back_populates="tasks")

    index: Mapped[int] = mapped_column(postgresql.INTEGER)
    description: Mapped[str] = mapped_column(postgresql.TEXT)

    start_date: Mapped[date | None] = mapped_column(postgresql.DATE(), nullable=True)
    end_date: Mapped[date | None] = mapped_column(postgresql.DATE(), nullable=True)

    allocated: Mapped[bool] = mapped_column(postgresql.BOOLEAN)

    # The lab that this task will be conducted in (if any)
    lab_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("lab.id"), nullable=True, default=None
    )
    lab: Mapped[Lab | None] = relationship()

    # The supervisor for this particular task.
    # Must be a supervisor of the requested lab
    supervisor_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("user.id"), nullable=True, default=None
    )
    supervisor: Mapped[User] = relationship()

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        task = await db.get(ResearchPlanTask, id)
        if task is None:
            raise ResearchPlanTaskDoesNotExist(for_id=id)
        return task

    @classmethod
    async def get_for_plan_and_index(
        cls, db: LocalSession, plan: ResearchPlan | UUID, index: int
    ):
        plan_id = plan.id if isinstance(plan, ResearchPlan) else plan
        task = await db.scalar(
            select(ResearchPlanTask).where(
                ResearchPlanTask.plan_id == plan_id, ResearchPlanTask.index == index
            )
        )
        if task is None:
            raise ResearchPlanTaskDoesNotExist(for_plan_index=(plan_id, index))
        return task


class ResearchPlanAttachment(Base):
    __tablename__ = "research_plan_attachment"

    id: Mapped[uuid_pk]

    plan_id: Mapped[UUID] = mapped_column(ForeignKey("research_plan.id"))
    plan: Mapped[ResearchPlan] = relationship(back_populates="attachments")

    file: Mapped[list[File]] = mapped_column(
        FileField(upload_storage="research_plans"),
    )


class ResearchPlan(LabResourceConsumer, Base):
    __tablename__ = "research_plan"

    id: Mapped[uuid_pk]

    title: Mapped[str] = mapped_column(postgresql.VARCHAR(256))
    description: Mapped[str] = mapped_column(postgresql.TEXT(), default="{}")

    # The principal researcher.
    researcher_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    researcher: Mapped[User] = relationship(foreign_keys=[researcher_id])

    # The funding that is applicable to this plan
    funding_id: Mapped[UUID] = mapped_column(ForeignKey("research_funding.id"))
    funding: Mapped[ResearchFunding] = relationship()

    # The lab tech who is responsible for allocating the tasks associated with this plan
    coordinator_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    coordinator: Mapped[User] = relationship(foreign_keys=[coordinator_id])

    tasks: Mapped[ResearchPlanTask] = relationship(
        back_populates="plan", order_by=ResearchPlanTask.index
    )

    resources: Mapped[list[LabResource]] = relationship(
        secondary=research_plan_resources
    )

    attachments: Mapped[list[ResearchPlanAttachment]] = relationship(
        back_populates="plan"
    )

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        plan = await db.get(ResearchPlan, id)
        if plan is None:
            raise ResearchPlanDoesNotExist(for_id=id)
        return plan

    def select_resources(
        self, resource_type: LabResourceType
    ) -> Select[tuple[LabResource]]:
        return select(type(self).resources).where(LabResource.type == resource_type)  # type: ignore
