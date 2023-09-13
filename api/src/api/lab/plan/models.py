from __future__ import annotations
from datetime import date
from uuid import UUID
import re

from typing import TYPE_CHECKING, Any, Optional
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema

from sqlalchemy import DATE, Select, Table, Column, ForeignKey, select
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import VARCHAR, TEXT
from api.lab.plan.errors import ExperimentalPlanDoesNotExist

from api.uni.types import Discipline
from db.orm import uuid_pk, email
from api.base.models import Base
from ..types import LabType

if TYPE_CHECKING:
    from api.uni.models import Campus
    from api.uni.research.models import FundingModel

from .resource.models import ResourceContainer

class ExperimentalPlan_(Base):
    __tablename__ = 'experimental_plans'

    id: Mapped[uuid_pk]
    title: Mapped[str] = mapped_column(VARCHAR(128))

    funding_model_id: Mapped[UUID] = mapped_column(ForeignKey('uni_research_funding_model.id'))
    funding_model: Mapped[FundingModel] = relationship()

    researcher_base_campus_id: Mapped[UUID] = mapped_column(ForeignKey('campuses.id'))
    researcher_base_campus: Mapped[Campus] = relationship()

    researcher_discipline: Mapped[Discipline] = mapped_column(ENUM(Discipline))

    # The name of the researcher responsible for this experimental plan
    researcher_email: Mapped[email]
    # The supervisor associated with the plan, or None if the researcher is an academic
    supervisor_email: Mapped[email | None]

    process_summary: Mapped[str] = mapped_column(
        TEXT,
        server_default=''
    )

    work_units: Mapped[list[WorkUnit_]] = relationship(
        back_populates='plan'
    )

    @staticmethod
    async def get_by_id(db: AsyncSession, id: UUID) -> ExperimentalPlan_:
        m = await db.get(ExperimentalPlan_, id)
        if m is None:
            raise ExperimentalPlanDoesNotExist.for_id(id)
        return m

    
class WorkUnit_(ResourceContainer, Base):
    __tablename__ = 'work_units'

    id: Mapped[uuid_pk]

    plan_id: Mapped[UUID] = mapped_column(ForeignKey('experimental_plans.id'))
    plan: Mapped[ExperimentalPlan_] = relationship(back_populates='work_units')

    index: Mapped[int] = mapped_column()

    lab_type: Mapped[LabType] = mapped_column(ENUM(LabType))
    technician_email: Mapped[email]

    process_summary: Mapped[str] = mapped_column(TEXT)

    start_date: Mapped[Optional[date]] = mapped_column(DATE)
    end_date: Mapped[Optional[date]] = mapped_column(DATE)

    @staticmethod
    async def get_by_id(db: AsyncSession, id: UUID) -> WorkUnit_:
        return await db.get(WorkUnit_, id)

    @staticmethod
    async def get_by_plan_and_index(db: AsyncSession, plan_id: UUID, index: int) -> WorkUnit_:
        return await db.scalar(
            select(WorkUnit_).where(WorkUnit_.plan_id == plan_id, WorkUnit_.index == index)
        )

    @staticmethod
    def list_for_experimental_plan(db: AsyncSession, plan_id: UUID) -> Select[tuple[WorkUnit_]]:
        return (
            select(WorkUnit_)
                .where(WorkUnit_.plan_id == plan_id)
                .order_by(WorkUnit_.index)
        )
    
    @staticmethod
    def list_for_technician(db: AsyncSession, technician_email: str) -> Select[tuple[WorkUnit_]]:
        return select(WorkUnit_).where(WorkUnit_.technician_email == technician_email)

