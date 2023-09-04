from __future__ import annotations
from datetime import date
from uuid import UUID

from typing import TYPE_CHECKING, Optional

from sqlalchemy import DATE, Table, Column, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import VARCHAR, TEXT

from api.utils.db import uuid_pk
from api.base.models import Base

if TYPE_CHECKING:
    from api.uni.models import Campus

from .types import ExperimentalPlanType, LabType
from .resource.models import ResourceContainer

class ExperimentalPlan(Base):
    __tablename__ = 'experimental_plans'

    id: Mapped[uuid_pk]
    type: Mapped[ExperimentalPlanType] = mapped_column(
        ENUM(ExperimentalPlanType),
    )

    other_type_description: Mapped[str] = mapped_column(
        VARCHAR(64),
    )

    # The email of the researcher that is responsible for conducting
    # the experiment
    researcher: Mapped[str]
    # The email of the supervisor that is resposiblwe for conducting
    # the experiment, or None if the researcher is an academic.
    supervisor: Mapped[Optional[str]]

    campus_id: Mapped[UUID] = mapped_column(
        ForeignKey('campuses.id'),
    )
    campus: Mapped[Campus] = relationship()
    process_summary: Mapped[str] = mapped_column(
        TEXT,
        server_default=''
    )

    work_units: Mapped[list[WorkUnit]] = relationship()

class WorkUnit(ResourceContainer, Base):
    __tablename__ = 'work_units'

    id: Mapped[uuid_pk]

    plan_id: Mapped[UUID] = mapped_column(ForeignKey('experimental_plans.id'))
    plan: Mapped[ExperimentalPlan] = relationship(back_populates='work_units')

    campus_id: Mapped[UUID] = mapped_column(ForeignKey('campuses.id'))
    campus: Mapped[Campus] = relationship()
    lab_type: Mapped[LabType] = mapped_column(ENUM(LabType))

    technician: Mapped[str] = mapped_column(VARCHAR(64))

    process_summary: Mapped[str] = mapped_column(TEXT)

    start_date: Mapped[Optional[date]] = mapped_column(DATE)
    end_date: Mapped[Optional[date]] = mapped_column(DATE)

