from __future__ import annotations

from datetime import date, datetime
from typing import (
    TYPE_CHECKING,
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
    all_,
    and_,
    delete,
    func,
    select,
    update,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr
from sqlalchemy.dialects import postgresql
from sqlalchemy_file import FileField, File
from db import LocalSession, local_object_session

from db.models.base.base import model_id
from db.models.fields import uuid_pk

from db.models.lab import Lab
from db.models.lab.provisionable import LabProvision
from db.models.lab.allocatable import LabAllocationConsumer
from db.models.material.material_allocation import MaterialAllocation
from db.models.uni.discipline import DISCIPLINE_ENUM, Discipline

from ..base import Base, DoesNotExist

from db.models.user import User
from db.models.uni.funding import Funding

if TYPE_CHECKING:
    from db.models.equipment import EquipmentLease
    from db.models.software.software_lease import SoftwareLease


class ResearchPlanDoesNotExist(DoesNotExist):
    def __init__(self, *, for_id: UUID | None = None):
        msg = None
        super().__init__("ResearchPlan", msg, for_id=for_id)


class ResearchPlanTaskDoesNotExist(DoesNotExist):
    def __init__(
        self, for_id: UUID | None = None, for_plan_index: tuple[UUID, int] | None = None
    ):
        if for_plan_index:
            plan, index = for_plan_index
            msg = f"No task for plan {plan} at {index}"
        return super().__init__("ResearchPlan", msg, for_id=for_id)


research_plan_task_setup_provisions = Table(
    "research_plan_task_setup_provisions",
    Base.metadata,
    Column("plan_id", ForeignKey("research_plan_task.id"), primary_key=True),
    Column("provision_id", ForeignKey("lab_provision.id"), primary_key=True),
)

research_plan_teardown_provisions = Table(
    "research_plan_task_teardown_provisions",
    Base.metadata,
    Column("plan_id", ForeignKey("research_plan_task.id"), primary_key=True),
    Column("provision_id", ForeignKey("lab_provision.id"), primary_key=True),
)

research_plan_equipment_leases = Table(
    "research_plan_equipment_leases",
    Base.metadata,
    Column("plan_id", ForeignKey("research_plan.id"), primary_key=True),
    Column("equipment_lease_id", ForeignKey("equipment_lease.id"), primary_key=True),
)

research_plan_software_leases = Table(
    "research_plan_software_leases",
    Base.metadata,
    Column("plan_id", ForeignKey("research_plan.id"), primary_key=True),
    Column("software_lease_id", ForeignKey("software_lease.id"), primary_key=True),
)

research_plan_material_allocations = Table(
    "research_plan_input_materials",
    Base.metadata,
    Column("plan_id", ForeignKey("research_plan.id"), primary_key=True),
    Column("allocation_id", ForeignKey("material_allocation.id"), primary_key=True),
)

class ResearchPlanTask(Base):
    __tablename__ = "research_plan_task"
    __table_args__ = (UniqueConstraint("plan_id", "index"),)

    id: Mapped[uuid_pk] = mapped_column()

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

    @declared_attr
    def setup_provisions(cls) -> Mapped[list[LabProvision]]:
        return relationship(
            "LabProvision",
            secondary=research_plan_task_setup_provisions,
            overlaps='teardown_provisions'
        )

    @declared_attr
    def teardown_provisions(cls) -> Mapped[list[LabProvision]]:
        return relationship(
            "LabProvision",
            secondary=research_plan_task_setup_provisions,
            overlaps='setup_provisions'
        )

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


def query_research_plan_tasks(
    plan: ResearchPlan | UUID | None = None
) -> Select[tuple[ResearchPlanTask]]:
    where_clauses: list = []

    if plan:
        where_clauses.append(
            ResearchPlanTask.plan_id == model_id(plan)
        )

    return select(ResearchPlanTask).where(*where_clauses)



class ResearchPlanAttachment(Base):
    __tablename__ = "research_plan_attachment"

    id: Mapped[uuid_pk] = mapped_column()

    plan_id: Mapped[UUID] = mapped_column(ForeignKey("research_plan.id"))
    plan: Mapped[ResearchPlan] = relationship(back_populates="attachments")

    file: Mapped[list[File]] = mapped_column(
        FileField(upload_storage="research_plans"),
    )

def query_research_plan_attachments(
    plan: ResearchPlan | UUID | None = None
) -> Select[tuple[ResearchPlanAttachment]]:
    where_clauses: list = []

    if plan:
        where_clauses.append(
            ResearchPlanAttachment.plan_id == model_id(plan)
        )

    return select(ResearchPlanAttachment).where(*where_clauses)


class ResearchPlan(LabAllocationConsumer, Base):
    __tablename__ = "research_plan"

    __mapper_args__ = {
        "polymorphic_on": "type",
        "polymorphic_identity": "research_plan"
    }

    id: Mapped[UUID] = mapped_column(ForeignKey("lab_allocation_consumer.id"), primary_key=True)
    discipline: Mapped[Discipline] = mapped_column(DISCIPLINE_ENUM)

    title: Mapped[str] = mapped_column(postgresql.VARCHAR(256))
    description: Mapped[str] = mapped_column(postgresql.TEXT(), default="{}")

    # The principal researcher.
    researcher_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    researcher: Mapped[User] = relationship(foreign_keys=[researcher_id])

    # The funding that is applicable to this plan
    funding_id: Mapped[UUID] = mapped_column(ForeignKey("uni_funding.id"))
    funding: Mapped[Funding] = relationship()

    # The lab tech who is responsible for allocating the tasks associated with this plan
    coordinator_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    coordinator: Mapped[User] = relationship(foreign_keys=[coordinator_id])

    # The default lab to conduct tasks in. Must be the default lab for the researcher's discipline and campus.
    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship(foreign_keys=[lab_id])

    tasks: Mapped[list[ResearchPlanTask]] = relationship(
        back_populates="plan", order_by=ResearchPlanTask.index
    )

    @declared_attr
    def equipment_leases(self) -> Mapped[list[EquipmentLease]]:
        return relationship(
            "EquipmentLease",
            secondary=research_plan_equipment_leases
        )

    @declared_attr
    def software_leases(self) -> Mapped[list[SoftwareLease]]:
        return relationship(
            "SoftwareLease",
            secondary=research_plan_software_leases
        )

    @declared_attr
    def input_materials(self) -> Mapped[list[MaterialAllocation]]:
        return relationship(
            "MaterialAllocation",
            secondary=research_plan_material_allocations,
            secondaryjoin=and_(
                MaterialAllocation.id == research_plan_material_allocations.c.allocation_id,
                MaterialAllocation.is_input == True
            ),
            overlaps="output_materials"
        )

    @declared_attr
    def output_materials(self) -> Mapped[list[MaterialAllocation]]:
        return relationship(
            "MaterialAllocation",
            secondary=research_plan_material_allocations,
            secondaryjoin=and_(
                MaterialAllocation.id == research_plan_material_allocations.c.allocation_id,
                MaterialAllocation.is_output == True
            ),
            overlaps="input_materials"
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

    def __init__(
        self,
        title: str,
        description: str,
        *,
        researcher: User | UUID,
        coordinator: User | UUID,
        lab: Lab | UUID,
        funding: Funding | UUID | None,
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
            funding_id=funding.id if isinstance(funding, Funding) else funding,
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


def query_research_plans(
    researcher: UUID | None = None,
    coordinator: UUID | None = None,
) -> Select[tuple[ResearchPlan]]:
    queries = []
    if researcher:
        queries.append(ResearchPlan.researcher_id == researcher)

    if coordinator:
        queries.append(ResearchPlan.coordinator_id == coordinator)

    return select(ResearchPlan).where(*queries)
