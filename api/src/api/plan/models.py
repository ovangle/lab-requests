from __future__ import annotations
from datetime import date
from uuid import UUID

from typing import TYPE_CHECKING, Optional

from sqlalchemy import DATE, Table, Column, ForeignKey, select
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import VARCHAR, TEXT

from api.utils.db import uuid_pk, EMAIL_DOMAIN
from api.base.models import Base

if TYPE_CHECKING:
    from api.uni.models import Campus

from .types import FundingType, LabType
from .resource.models import ResourceContainer

class ExperimentalPlan(Base):
    __tablename__ = 'experimental_plans'

    id: Mapped[uuid_pk]
    type: Mapped[FundingType] = mapped_column(VARCHAR(8))

    campus_id: Mapped[UUID] = mapped_column(ForeignKey('campuses.id'))
    campus: Mapped[Campus] = relationship(back_populates='campus')

    # The name of the researcher responsible for this experimental plan
    researcher_email: Mapped[str] = mapped_column(EMAIL_DOMAIN)
    # The supervisor associated with the plan, or None if the researcher is an academic
    supervisor_email: Mapped[str | None] = mapped_column(EMAIL_DOMAIN, nullable=True)

    process_summary: Mapped[str] = mapped_column(
        TEXT,
        server_default=''
    )

    work_units: Mapped[list[WorkUnit]] = relationship(
        back_populates='plan'
    )

    @staticmethod
    async def get_by_id(db: AsyncSession, id: UUID) -> ExperimentalPlan:
        result = await db.execute(
            select(ExperimentalPlan)
                .where(ExperimentalPlan.id == id)
        )
        return ExperimentalPlan(result)

    @staticmethod 
    async def list_for_researcher(db: AsyncSession, researcher_email: str) -> list[ExperimentalPlan]:
        results = await db.execute(
            select(ExperimentalPlan)
                .where(ExperimentalPlan.researcher_email == researcher_email)
        )
        return [ExperimentalPlan(record) for record in results]

    @staticmethod
    async def list_for_supervisor(db: AsyncSession, supervisor_email: str) -> list[ExperimentalPlan]:
        results = await db.execute(
            select(ExperimentalPlan)
                .where(ExperimentalPlan.supervisor_email == supervisor_email)
        )
        return [ExperimentalPlan(record) for record in results]


class WorkUnit(ResourceContainer, Base):
    __tablename__ = 'work_units'

    id: Mapped[uuid_pk]

    plan_id: Mapped[UUID] = mapped_column(ForeignKey('experimental_plans.id'))
    plan: Mapped[ExperimentalPlan] = relationship(back_populates='work_units')

    index: Mapped[int] = mapped_column()

    lab_type: Mapped[LabType] = mapped_column(ENUM(LabType))
    technician_email: Mapped[str] = mapped_column(EMAIL_DOMAIN)

    process_summary: Mapped[str] = mapped_column(TEXT)

    start_date: Mapped[Optional[date]] = mapped_column(DATE)
    end_date: Mapped[Optional[date]] = mapped_column(DATE)

    @staticmethod
    async def get_by_id(db: AsyncSession, id: UUID) -> WorkUnit:
        return ExperimentalPlan(await db.execute(
            select(WorkUnit).where(WorkUnit.id == id)
        ))

    @staticmethod
    async def get_by_plan_index(db: AsyncSession, plan_id: UUID, index: int) -> WorkUnit:
        return ExperimentalPlan(await db.execute(
            select(WorkUnit).where(WorkUnit.plan_id == plan_id, WorkUnit.index == index)
        ))

    @staticmethod
    async def list_by_plan(db: AsyncSession, plan_id: UUID) -> list[WorkUnit]:
        results = await db.execute(
            select(WorkUnit)
            .where(WorkUnit.plan_id == plan_id)
            .order_by(WorkUnit.index)
        )
        return [WorkUnit(record) for record in results]

    @staticmethod
    async def list_by_technician(db: AsyncSession, technician_email: str) -> list[WorkUnit]:
        results = await db.execute(
            select(WorkUnit)
            .where(WorkUnit.technician_email == technician_email)
        )
        return [WorkUnit(record) for record in results]

