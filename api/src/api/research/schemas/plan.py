from __future__ import annotations
import asyncio
from datetime import date

from typing import TYPE_CHECKING, Any, Coroutine, Optional
from uuid import UUID, uuid4

from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from db import LocalSession, local_object_session
from db.models.lab.lab import Lab
from db.models.uni import Discipline
from db.models.user import User
from db.models.research import (
    ResearchFunding,
    ResearchPlan,
    ResearchPlanTask,
    ResearchPlanAttachment,
)

from ...base.schemas import (
    ModelIndexPage,
    ModelView,
    ModelCreateRequest,
    ModelUpdateRequest,
    ModelLookup,
    ModelIndex,
)
from ...user.schemas.user import UserLookup, UserView, lookup_user
from ...lab.schemas import LabLookup
from ...lab.lab_resource_consumer import LabResourceConsumerView

from .funding import (
    ResearchFundingCreateRequest,
    ResearchFundingLookup,
    ResearchFundingView,
    lookup_or_create_research_funding,
)


class ResearchPlanTaskView(ModelView[ResearchPlanTask]):
    id: UUID
    index: int

    start_date: date | None
    end_date: date | None

    lab_id: UUID | None
    supervisor_id: UUID | None

    @classmethod
    async def from_model(cls, model: ResearchPlanTask, **kwargs):
        return cls(
            id=model.id,
            index=model.index,
            start_date=model.start_date,
            end_date=model.end_date,
            lab_id=model.lab_id,
            supervisor_id=model.supervisor_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class ResearchPlanTaskIndex(ModelIndex[ResearchPlanTaskView]):
    __item_view__ = ResearchPlanTaskView


# TODO: PEP 695
ResearchPlanTaskIndexPage = ModelIndexPage[ResearchPlanTaskView]


class ResearchPlanTaskCreateRequest(ModelCreateRequest[ResearchPlanTask]):
    """
    Creates a task as the last task in the current tasks for a plan
    """

    lab: LabLookup | UUID
    supervisor: UserLookup | UUID

    description: str
    start_date: date | None = None
    end_date: date | None = None

    async def do_create(
        self,
        db: LocalSession,
        *,
        plan: ResearchPlan | None = None,
        index: int | None = None,
        default_lab: Lab,
        default_supervisor: User,
        **kwargs,
    ):
        from ...lab.schemas import lookup_lab

        if plan is None:
            raise ValueError("Plan must be provided")
        if index is None:
            raise ValueError("Index must be provided")

        if self.lab == default_lab.id:
            lab = default_lab
        else:
            lab = await lookup_lab(db, self.lab)

        if self.supervisor == default_supervisor.id:
            supervisor_id = default_supervisor.id
        else:
            supervisor_id = (await lookup_user(db, self.supervisor)).id

        task = ResearchPlanTask(
            id=uuid4(),
            plan_id=plan.id,
            index=index,
            lab_id=lab.id,
            supervisor_id=supervisor_id,
            description=self.description,
            start_date=self.start_date,
            end_date=self.end_date,
        )
        db.add(task)
        return task

    async def do_update(
        self, task: ResearchPlanTask, db: LocalSession | None = None
    ) -> ResearchPlanTask:
        from api.lab.schemas import lookup_lab

        db = db or local_object_session(task)
        if self.lab != task.lab_id:
            task.lab_id = (await lookup_lab(db, self.lab)).id

        if self.supervisor != task.supervisor_id:
            task.supervisor_id = (await lookup_user(db, self.supervisor)).id

        task.description = self.description
        task.start_date = self.start_date
        task.end_date = self.end_date
        db.add(task)
        return task


class ResearchPlanAttachmentView(ModelView[ResearchPlanAttachment]):
    id: UUID
    path: str

    @classmethod
    async def from_model(cls, model: ResearchPlanAttachment):
        return cls(
            id=model.id,
            path=str(model.file),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class ResearchPlanView(LabResourceConsumerView[ResearchPlan]):
    id: UUID
    title: str = Field(max_length=256)
    description: str

    funding: ResearchFundingView

    researcher: UserView
    coordinator: UserView

    tasks: list[ResearchPlanTaskView]
    attachments: list[ResearchPlanAttachmentView]

    @classmethod
    async def from_model(cls, model: ResearchPlan, **kwargs) -> ResearchPlanView:
        assert not kwargs

        funding = await ResearchFundingView.from_model(model.funding)
        researcher = await UserView.from_model(await model.awaitable_attrs.researcher)
        coordinator = await UserView.from_model(await model.awaitable_attrs.coordinator)

        task_models = await model.awaitable_attrs.tasks
        tasks = await asyncio.gather(
            *[ResearchPlanTaskView.from_model(t) for t in task_models]
        )

        attachment_models = await model.awaitable_attrs.attachments
        attachments = await asyncio.gather(
            *[ResearchPlanAttachmentView.from_model(a) for a in attachment_models]
        )

        return await super().from_model(
            model,
            id=model.id,
            title=model.title,
            description=model.description,
            funding=funding,
            researcher=researcher,
            coordinator=coordinator,
            tasks=tasks,
            attachments=attachments,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class ResearchPlanLookup(ModelLookup[ResearchPlan]):
    id: UUID | None = None

    async def get(self, db: LocalSession):
        if self.id:
            return await ResearchPlan.get_for_id(db, self.id)
        raise


async def lookup_research_plan(db: LocalSession, lookup: ResearchPlanLookup | UUID):
    if isinstance(lookup, UUID):
        lookup = ResearchPlanLookup(id=lookup)
    return await lookup.get(db)


class ResearchPlanIndex(ModelIndex[ResearchPlanView]):
    __item_view__ = ResearchPlanView


# TODO: PEP 695
ResearchPlanIndexPage = ModelIndexPage[ResearchPlanView]


class ResearchPlanCreateRequest(ModelCreateRequest[ResearchPlan]):
    id: UUID | None = None
    title: str
    description: str | None = None

    funding: ResearchFundingLookup | UUID
    researcher: UserLookup | UUID
    coordinator: UserLookup | UUID

    tasks: list[ResearchPlanTaskCreateRequest]

    async def do_create(self, db: LocalSession, **kwargs) -> ResearchPlan:
        researcher = await lookup_user(db, self.researcher)
        coordinator = await lookup_user(db, self.coordinator)
        plan = ResearchPlan(
            id=self.id or uuid4(),
            title=self.title,
            funding=await lookup_or_create_research_funding(db, self.funding),
            researcher_id=researcher.id,
            coordinator_id=coordinator.id,
        )
        db.add(plan)

        if researcher.primary_discipline is None:
            raise ValueError(
                "Cannot create research plan for researcher with no primary discipline"
            )

        default_lab = await Lab.get_for_campus_and_discipline(
            db, researcher.campus, researcher.primary_discipline
        )

        for task in self.tasks:
            await task.do_create(
                db, plan=plan, default_supervisor=coordinator, default_lab=default_lab
            )

        return plan


class ResearchPlanTaskSlice(ModelUpdateRequest[ResearchPlan]):
    start_index: int
    end_index: int | None = None
    items: list[ResearchPlanTaskCreateRequest]

    async def do_update(
        self,
        plan: ResearchPlan,
        *,
        tasks: list[ResearchPlanTask],
        db: LocalSession,
        default_lab: Lab,
        default_supervisor: User,
    ):
        to_update = tasks[self.start_index : self.end_index or len(tasks)]
        for index, item in enumerate(self.items):
            if index >= len(to_update):
                await item.do_create(
                    db, default_lab=default_lab, default_supervisor=default_supervisor
                )
            else:
                await item.do_update(to_update[index], db=db)
        for index, task in enumerate(tasks):
            if task.index != index:
                task.index = index
                db.add(task)
        return plan


class ResearchPlanUpdateRequest(ModelUpdateRequest[ResearchPlan]):
    tasks: list[ResearchPlanTaskSlice]

    async def do_update(self, model: ResearchPlan):
        db = local_object_session(model)
        all_tasks = await model.awaitable_attrs.tasks

        for task_slice in self.tasks:
            await task_slice.do_update(
                model,
                tasks=all_tasks,
                default_supervisor=await model.awaitable_attrs.coordinator,
                default_lab=await model.awaitable_attrs.lab,
                db=db,
            )
        return model


class ResearchPlanTaskLookup(ModelLookup[ResearchPlanTask]):
    id: UUID | None = None
    plan_index: tuple[UUID | ResearchPlanLookup, int]

    async def get(self, db: LocalSession):
        if self.id:
            return await ResearchPlanTask.get_for_id(db, self.id)
        if self.plan_index:
            plan_lookup, index = self.plan_index
            if isinstance(plan_lookup, UUID):
                plan = plan_lookup
            else:
                plan = await lookup_research_plan(db, plan_lookup)

            return await ResearchPlanTask.get_for_plan_and_index(db, plan, index)
        raise ValueError("Either id or plan_index must be provided")
