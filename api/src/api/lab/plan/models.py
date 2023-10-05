from __future__ import annotations
from datetime import date
from uuid import UUID
import re

from typing import TYPE_CHECKING, Any, Optional
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema

from sqlalchemy import DATE, Select, Table, Column, ForeignKey, func, select
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship, column_property
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import VARCHAR, TEXT
from api.lab.plan.errors import ExperimentalPlanDoesNotExist

from api.uni.types import Discipline
from db.orm import uuid_pk, email
from api.base.models import Base
from ..types import LabType

if TYPE_CHECKING:
    from api.uni.models import Campus
    from api.uni.research.models import FundingModel_
    from api.lab.work_unit.models import WorkUnit_

from api.lab.work_unit.resource.models import ResourceContainer_

class ExperimentalPlan_(Base):
    __tablename__ = 'experimental_plans'

    id: Mapped[uuid_pk] = mapped_column()
    title: Mapped[str] = mapped_column(VARCHAR(128))

    funding_model_id: Mapped[UUID] = mapped_column(ForeignKey('uni_research_funding_model.id'))
    funding_model: Mapped[FundingModel_] = relationship()

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
