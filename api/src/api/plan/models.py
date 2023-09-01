from __future__ import annotations
from datetime import date

from typing import TYPE_CHECKING, Optional

from sqlalchemy import DATE, UUID, Table, Column, ForeignKey
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

    id: uuid_pk
    type: Mapped[ExperimentalPlanType] = mapped_column(
        ENUM(ExperimentalPlanType),
    )
    other_type_description: Mapped[str] = mapped_column(
        VARCHAR(64),
    )

    campus_id: Mapped[UUID] = mapped_column(
        ForeignKey('campuses.id'),
    )
    campus: Mapped[Campus] = relationship(back_populates='campus')
    process_summary: Mapped[str] = mapped_column(
        TEXT,
        server_default=''
    )

    work_units: Mapped[list['WorkUnit']] = relationship(
        back_populates='plan'
    )

class WorkUnit(ResourceContainer, Base):
    __table_name__ = 'work_units'

    id: uuid_pk

    plan_id: Mapped[UUID] = mapped_column(ForeignKey('plans.id'))
    plan: Mapped[ExperimentalPlan] = relationship(back_populates='work_units')

    lab_type: Mapped[LabType] = mapped_column(ENUM(LabType))
    technician: Mapped[str] = mapped_column(VARCHAR(64))

    process_summary: Mapped[str] = mapped_column(TEXT)

    start_date: Mapped[Optional[date]] = mapped_column(DATE)
    end_date: Mapped[Optional[date]] = mapped_column(DATE)

