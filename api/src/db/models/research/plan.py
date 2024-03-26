from __future__ import annotations

from datetime import date, datetime
from typing import (
    TYPE_CHECKING,
    Any,
    AsyncContextManager,
    Callable,
    Coroutine,
    Optional,
    TypedDict,
)
from uuid import UUID, uuid4
from sqlalchemy import (
    Column,
    ForeignKey,
    Select,
    Table,
    UniqueConstraint,
    delete,
    func,
    select,
    update,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql
from sqlalchemy_file import FileField, File
from db import LocalSession, local_object_session

from db.models.base.fields import uuid_pk
from db.models.lab.lab_resource import LabResource, LabResourceType
from db.models.uni.discipline import Discipline, uni_discipline
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

    def __init__(
        self, plan: ResearchPlan | UUID, index: int, attrs: ResearchPlanTaskAttrs
    ):
        plan_id = plan.id if isinstance(plan, ResearchPlan) else plan
        super().__init__(plan_id=plan_id, index=index, **attrs)

    def set_attrs(self, task_attrs: ResearchPlanTaskAttrs):
        session = local_object_session(self)
        if task_attrs["description"] != self.description:
            self.description = task_attrs["description"]
            session.add(self)
        if self.start_date != task_attrs["start_date"]:
            self.start_date = task_attrs["start_date"]
            session.add(self)
        if self.end_date != task_attrs["end_date"]:
            self.end_date = task_attrs["end_date"]
            session.add(self)
        if self.lab_id != task_attrs["lab_id"]:
            self.lab_id = task_attrs["lab_id"]
            session.add(self)
        if self.supervisor_id != task_attrs["supervisor_id"]:
            self.supervisor_id = task_attrs["supervisor_id"]
            session.add(self)


class ResearchPlanTaskAttrs(TypedDict):
    description: str
    start_date: Optional[date]
    end_date: Optional[date]
    lab_id: UUID
    supervisor_id: UUID


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

    discipline: Mapped[uni_discipline]
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

    # The default lab to conduct tasks in. Must be the default lab for the researcher's discipline and campus.
    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship(foreign_keys=[lab_id])

    tasks: Mapped[list[ResearchPlanTask]] = relationship(
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

    def __init__(
        self,
        title: str,
        description: str,
        *,
        researcher: User | UUID,
        coordinator: User | UUID,
        lab: Lab | UUID,
        funding: ResearchFunding | UUID | None,
        tasks: list[ResearchPlanTaskAttrs],
    ):
        super().__init__(
            id=uuid4(),
            title=title,
            description=description,
            researcher_id=researcher.id if isinstance(researcher, User) else researcher,
            coordinator_id=(
                coordinator.id if isinstance(coordinator, User) else coordinator
            ),
            funding_id=funding.id if isinstance(funding, ResearchFunding) else funding,
            lab=lab,
        )

        self.tasks = [ResearchPlanTask(self.id, i, t) for i, t in enumerate(tasks)]

    async def append_task(self, task_attrs: ResearchPlanTaskAttrs):
        session = local_object_session(self)
        last_index = (
            await session.scalar(
                select(func.count())
                .select_from(ResearchPlanTask)
                .where(ResearchPlanTask.plan_id == self.id)
            )
        ) or 0

        session.add(ResearchPlanTask(self, last_index, task_attrs))

    async def insert_task(self, at_index: int, items: ResearchPlanTaskAttrs):
        session = local_object_session(self)
        await session.execute(
            update(ResearchPlanTask)
            .values(index=ResearchPlanTask.index + 1)
            .where(
                ResearchPlanTask.plan_id == self.id,
                ResearchPlanTask.index > at_index,
            )
        )
        session.add(ResearchPlanTask(self, at_index, items))
        await session.commit()

    async def insert_all_tasks(
        self, at_index: int, task_attrs: list[ResearchPlanTaskAttrs]
    ):
        session = local_object_session(self)
        await session.execute(
            update(ResearchPlanTask)
            .values(index=ResearchPlanTask.index + len(task_attrs))
            .where(
                ResearchPlanTask.plan_id == self.id,
                ResearchPlanTask.index > at_index,
            )
        )
        session.add_all(
            [ResearchPlanTask(self, at_index + i, t) for i, t in enumerate(task_attrs)]
        )
        await session.commit()

    async def splice_tasks(
        self,
        start_index: int,
        end_index: int | None,
        items: list[ResearchPlanTaskAttrs],
        session: LocalSession,
    ):
        if end_index is None:
            end_index = len(await self.awaitable_attrs.tasks)
        all_tasks = await self.awaitable_attrs.tasks
        if end_index is None:
            end_index = len(all_tasks)

        tasks = all_tasks[start_index:end_index]

        for i, item in enumerate(items):
            if i < len(tasks):
                tasks[i].set_attrs(item)
            else:
                await self.insert_task(start_index + i, item)

        if len(tasks) > len(items):
            await session.execute(
                delete(ResearchPlanTask).where(
                    ResearchPlanTask.plan_id == self.id,
                    ResearchPlanTask.index > start_index + len(items),
                    ResearchPlanTask.index <= end_index,
                )
            )

        await session.commit()
