from __future__ import annotations

from datetime import date
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, relationship

from ..base import Base
from ..base.views import view

from ..user import User
from ..research.plan import ResearchPlanTask

from .lab import Lab, lab_supervisor

lab_work_unit_task = view(
    "lab_work_unit_task",
    Base.metadata,
    selectable=sa.select(
        ResearchPlanTask.lab_id.label("lab_id"),
        ResearchPlanTask.supervisor_id.label("supervisor_id"),
        ResearchPlanTask.plan_id.label("plan_id"),
    ),
)
lab_work_unit = view("lab_work_unit", Base.metadata, selectable=sa.select())


class LabWorkUnitTask(Base):
    __table__ = lab_work_unit_task

    lab_id: Mapped[UUID]
    supervisor_id: Mapped[UUID]

    index: Mapped[int]
    description: Mapped[str]

    start_date: Mapped[date | None]
    end_date: Mapped[date | None]


class LabWorkUnit(Base):
    __table__ = lab_work_unit

    lab_id: Mapped[UUID]
    supervisor_id: Mapped[UUID]
    plan_id: Mapped[UUID]
