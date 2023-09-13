from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import ForeignKey, select, Select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TEXT, DATE
from sqlalchemy.dialects import postgresql as pg_dialect

from db import LocalSession
from db.orm import uuid_pk, email
from api.base.models import Base
from api.lab.types import LabType
from api.lab.plan.models import ExperimentalPlan_

from .resource.models import ResourceContainer
    
class WorkUnit_(ResourceContainer, Base):
    __tablename__ = 'work_units'

    id: Mapped[uuid_pk]

    plan_id: Mapped[UUID] = mapped_column(ForeignKey('experimental_plans.id'))
    plan: Mapped[ExperimentalPlan_] = relationship(back_populates='work_units')

    index: Mapped[int] = mapped_column()

    lab_type: Mapped[LabType] = mapped_column(pg_dialect.ENUM(LabType))
    technician_email: Mapped[email]

    process_summary: Mapped[str] = mapped_column(TEXT)

    start_date: Mapped[Optional[date]] = mapped_column(DATE)
    end_date: Mapped[Optional[date]] = mapped_column(DATE)

    def __init__(self, plan_id: UUID):
        self.plan_id = plan_id

    @staticmethod
    async def get_by_id(db: LocalSession, id: UUID) -> WorkUnit_:
        return await db.get(WorkUnit_, id)

    @staticmethod
    async def get_by_plan_and_index(db: LocalSession, plan_id: UUID, index: int) -> WorkUnit_:
        return await db.scalar(
            select(WorkUnit_).where(WorkUnit_.plan_id == plan_id, WorkUnit_.index == index)
        )

    @staticmethod
    def list_for_experimental_plan(db: LocalSession, plan_id: UUID) -> Select[tuple[WorkUnit_]]:
        return (
            select(WorkUnit_)
                .where(WorkUnit_.plan_id == plan_id)
                .order_by(WorkUnit_.index)
        )
    
    @staticmethod
    def list_for_technician(db: LocalSession, technician_email: str) -> Select[tuple[WorkUnit_]]:
        return select(WorkUnit_).where(WorkUnit_.technician_email == technician_email)

