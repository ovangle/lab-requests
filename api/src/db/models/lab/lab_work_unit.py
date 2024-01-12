from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, relationship, mapped_column
from sqlalchemy.ext.asyncio import async_object_session

from db import LocalSession

from ..base import Base
from ..base.views import view

from ..user import User
from ..research.plan import ResearchPlan, ResearchPlanTask

from .lab import Lab, lab_supervisor


lab_work_unit = view(
    "lab_work_unit",
    Base.metadata,
    selectable=sa.select(
        Lab.id.label("lab_id"),
        ResearchPlan.id.label("plan_id"),
        lab_supervisor.c.user_id.label("supervisor_id"),
        ResearchPlan.created_at.label("created_at"),
        ResearchPlan.updated_at.label("updated_at"),
    ),
)


class LabWorkUnit(Base):
    __table__ = lab_work_unit

    lab_id: Mapped[UUID]
    supervisor_id: Mapped[UUID]
    plan_id: Mapped[UUID]

    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]

    def select_tasks(self) -> sa.Select[tuple[ResearchPlanTask]]:
        return sa.select(ResearchPlanTask).where(
            ResearchPlanTask.plan_id == self.plan_id,
            ResearchPlanTask.lab_id == self.lab_id,
            ResearchPlanTask.supervisor_id == self.supervisor_id,
        )

    @property
    async def tasks(self):
        session = async_object_session(self)
        if not isinstance(session, LocalSession):
            raise RuntimeError("detached")
