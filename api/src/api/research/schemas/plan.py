from __future__ import annotations
import asyncio
from datetime import date

from typing import TYPE_CHECKING, Any, Coroutine, Optional
from uuid import UUID, uuid4

from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from db import LocalSession
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


class ResearchPlanTaskIndex(ModelIndex[ResearchPlanTaskView, ResearchPlanTask]):
    __item_view__ = ResearchPlanTaskView


# TODO: PEP 695
ResearchPlanTaskIndexPage = ModelIndexPage[ResearchPlanTaskView, ResearchPlanTask]


class ResearchPlanTaskAppendRequest(ModelCreateRequest[ResearchPlanTask]):
    """
    Creates a task as the last task in the current tasks for a plan
    """

    description: str
    start_date: date | None = None
    end_date: date | None = None

    lab: LabLookup | UUID

    async def do_create(self, db: LocalSession, *, plan: ResearchPlan | None = None):
        from ...lab.schemas import lookup_lab

        if plan is None:
            raise ValueError("Plan must be provided")

        next_index = len(await plan.awaitable_attrs.tasks)

        task = ResearchPlanTask(
            id=uuid4(),
            plan_id=plan.id,
            index=next_index,
            lab=await lookup_lab(db, self.lab),
            description=self.description,
            start_date=self.start_date,
            end_date=self.end_date,
        )
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


class ResearchPlanIndex(ModelIndex[ResearchPlanView, ResearchPlan]):
    __item_view__ = ResearchPlanView


# TODO: PEP 695
ResearchPlanIndexPage = ModelIndexPage[ResearchPlanView, ResearchPlan]


class ResearchPlanCreateRequest(ModelCreateRequest[ResearchPlan]):
    id: UUID | None = None
    title: str
    description: str | None = None

    funding: ResearchFundingCreateRequest | ResearchFundingLookup | UUID
    researcher: UserLookup | UUID
    coordinator: UserLookup | UUID

    tasks: list[ResearchPlanTaskAppendRequest]

    async def do_create(self, db: LocalSession) -> ResearchPlan:
        plan = ResearchPlan(
            id=self.id or uuid4(),
            title=self.title,
            funding=await lookup_or_create_research_funding(db, self.funding),
            researcher=await lookup_user(db, self.researcher),
            coordinator=await lookup_user(db, self.coordinator),
        )
        db.add(plan)

        for task in self.tasks:
            await task.do_create(db, plan=plan)

        return plan


class ResearchPlanUpdateRequest(ModelUpdateRequest[ResearchPlan]):
    async def do_update(self, model: ResearchPlan):
        raise NotImplementedError


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
