from __future__ import annotations
import asyncio
from datetime import date

from typing import TYPE_CHECKING, Any, Coroutine, Optional
from uuid import UUID, uuid4

from pydantic import Field
from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession

from db import LocalSession, local_object_session
from db.models.base.errors import DoesNotExist
from db.models.lab.lab import Lab
from db.models.research.plan import ResearchPlanAttachment, query_research_plans
from db.models.uni import Discipline
from db.models.user import User
from db.models.research import (
    ResearchFunding,
    ResearchPlan,
    ResearchPlanTask,
    ResearchPlanTaskAttrs,
)

from ..base import (
    ModelIndexPage,
    ModelDetail,
    ModelCreateRequest,
    ModelUpdateRequest,
    ModelLookup,
    ModelIndex,
)
from ..user.user import UserLookup, UserDetail, lookup_user
from ..lab.lab import LabLookup

from .funding import (
    ResearchFundingCreateRequest,
    ResearchFundingLookup,
    ResearchFundingDetail,
    lookup_or_create_research_funding,
    lookup_research_funding,
)


class ResearchPlanTaskDetail(ModelDetail[ResearchPlanTask]):
    plan_id: UUID
    id: UUID
    index: int

    description: str

    start_date: date | None
    end_date: date | None

    lab_id: UUID | None
    supervisor_id: UUID | None

    @classmethod
    async def from_base(cls, model: ResearchPlanTask, **kwargs):
        return cls(
            plan_id=model.plan_id,
            id=model.id,
            index=model.index,
            description=model.description,
            start_date=model.start_date,
            end_date=model.end_date,
            lab_id=model.lab_id,
            supervisor_id=model.supervisor_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


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
        default_lab: Lab | None = None,
        default_supervisor: User | None = None,
        **kwargs,
    ):
        from ..lab.lab import lookup_lab

        if plan is None:
            raise ValueError("Plan must be provided")
        if index is None:
            raise ValueError("Index must be provided")

        task = ResearchPlanTask(
            plan.id,
            index,
            await self.as_task_attrs(
                db,
                default_lab=default_lab,
                default_supervisor=default_supervisor,
            ),
        )

        db.add(task)
        await db.commit()
        return task

    async def as_task_attrs(
        self,
        db: LocalSession,
        default_lab: Lab | None = None,
        default_supervisor: User | None = None,
    ) -> ResearchPlanTaskAttrs:
        from ..lab.lab import lookup_lab

        assert default_lab is not None
        if self.lab == (default_lab and default_lab.id):
            lab = default_lab
        else:
            lab = await lookup_lab(db, self.lab)

        assert default_supervisor is not None
        if self.supervisor == default_supervisor.id:
            supervisor_id = default_supervisor.id
        else:
            supervisor_id = (await lookup_user(db, self.supervisor)).id

        return {
            "description": self.description,
            "lab_id": lab.id,
            "supervisor_id": supervisor_id,
            "start_date": self.start_date,
            "end_date": self.end_date,
        }


class ResearchPlanAttachmentView(ModelDetail[ResearchPlanAttachment]):
    id: UUID
    path: str

    @classmethod
    async def from_base(cls, model: ResearchPlanAttachment):
        return cls(
            id=model.id,
            path=str(model.file),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class ResearchPlanDetail(ModelDetail[ResearchPlan]):
    title: str = Field(max_length=256)
    description: str
    discipline: Discipline

    funding: ResearchFundingDetail

    researcher: UserDetail
    coordinator: UserDetail
    lab: UUID

    tasks: list[ResearchPlanTaskDetail]
    attachments: list[ResearchPlanAttachmentView]

    @classmethod
    async def from_model(cls, model: ResearchPlan, **kwargs) -> ResearchPlanDetail:
        assert not kwargs

        funding = await ResearchFundingDetail.from_model(
            await model.awaitable_attrs.funding
        )
        researcher = await UserDetail.from_model(await model.awaitable_attrs.researcher)
        coordinator = await UserDetail.from_model(
            await model.awaitable_attrs.coordinator
        )

        task_models = await model.awaitable_attrs.tasks
        tasks = await asyncio.gather(
            *[ResearchPlanTaskDetail.from_base(t) for t in task_models]
        )

        attachment_models = await model.awaitable_attrs.attachments
        attachments = await asyncio.gather(
            *[ResearchPlanAttachmentView.from_base(a) for a in attachment_models]
        )

        return await super()._from_base(
            model,
            title=model.title,
            description=model.description,
            discipline=model.discipline,
            funding=funding,
            researcher=researcher,
            coordinator=coordinator,
            lab=model.lab_id,
            tasks=tasks,
            attachments=attachments,
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


class ResearchPlanIndex(ModelIndex[ResearchPlan]):

    researcher: UUID | None = None
    coordinator: UUID | None = None

    async def item_from_model(self, model: ResearchPlan):
        return await ResearchPlanDetail.from_model(model)

    def get_selection(self) -> Select[tuple[ResearchPlan]]:
        return query_research_plans(
            researcher=self.researcher, coordinator=self.coordinator
        )


# TODO: PEP 695
ResearchPlanIndexPage = ModelIndexPage[ResearchPlan]


class ResearchPlanCreateRequest(ModelCreateRequest[ResearchPlan]):
    id: UUID | None = None
    title: str
    description: str

    funding: ResearchFundingLookup | UUID
    researcher: UserLookup | UUID
    coordinator: UserLookup | UUID

    tasks: list[ResearchPlanTaskCreateRequest]

    async def do_create(self, db: LocalSession, **kwargs) -> ResearchPlan:
        researcher = await lookup_user(db, self.researcher)
        coordinator = await lookup_user(db, self.coordinator)

        if not researcher.primary_discipline:
            raise ValueError(
                "Cannot create plan for researcher with no primary discipline"
            )

        try:
            default_lab = await Lab.get_for_campus_and_discipline(
                db, researcher.campus_id, researcher.primary_discipline
            )
        except DoesNotExist as e:
            raise ValueError("Cannot create plan for researcher", e)

        tasks = [
            await task.as_task_attrs(
                db, default_lab=default_lab, default_supervisor=coordinator
            )
            for task in self.tasks
        ]

        plan = ResearchPlan(
            self.title,
            self.description,
            funding=(await lookup_research_funding(db, self.funding)),
            researcher=researcher.id,
            coordinator=coordinator.id,
            lab=default_lab,
            tasks=tasks,
        )
        db.add(plan)

        if researcher.primary_discipline is None:
            raise ValueError(
                "Cannot create research plan for researcher with no primary discipline"
            )

        for i, task in enumerate(self.tasks):
            await task.do_create(
                db,
                plan=plan,
                index=i,
                default_supervisor=coordinator,
                default_lab=default_lab,
            )

        return plan


class ResearchPlanTaskSlice(ModelUpdateRequest[ResearchPlan]):
    start_index: int
    end_index: int | None = None
    items: list[ResearchPlanTaskCreateRequest]

    async def do_update(
        self,
        model: ResearchPlan,
        default_lab: Lab | None = None,
        default_supervisor: User | None = None,
        db: LocalSession | None = None,
        **kwargs,
    ) -> ResearchPlan:
        assert db
        items = [
            await item.as_task_attrs(
                db,
                default_lab=default_lab,
                default_supervisor=default_supervisor,
            )
            for index, item in enumerate(self.items)
        ]
        end_index = self.end_index
        if end_index is None:
            end_index = len(await model.awaitable_attrs.tasks)

        await model.splice_tasks(self.start_index, self.end_index, items, session=db)
        return model


class ResearchPlanUpdateRequest(ModelUpdateRequest[ResearchPlan]):
    title: str
    description: str
    tasks: list[ResearchPlanTaskSlice]

    async def do_update(self, model: ResearchPlan, **kwargs) -> ResearchPlan:
        db = local_object_session(model)

        if model.title != self.title:
            model.title = self.title
            db.add(model)

        if model.description != self.description:
            model.description = self.description
            db.add(model)

        await db.commit()

        all_tasks = await model.awaitable_attrs.tasks

        if self.tasks is not None:
            for task_slice in self.tasks:
                await task_slice.do_update(
                    model,
                    tasks=all_tasks,
                    default_supervisor=await model.awaitable_attrs.coordinator,
                    default_lab=await model.awaitable_attrs.lab,
                    db=db,
                )
        await db.refresh(model)
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
