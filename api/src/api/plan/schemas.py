from datetime import date, datetime
from typing import Optional
from pydantic.dataclasses import dataclass
from sqlalchemy import UUID
from api.base.schemas import RecordMetadata

from api.uni.schemas import Campus
from .types import ExperimentalPlanType, LabType
from .resource.schemas import ResourceContainer

@dataclass(kw_only=True)
class ExperimentalPlanBase:
    type: ExperimentalPlanType
    other_type_description: Optional[str]

    campus: Campus
    process_summary: str

@dataclass(kw_only=True)
class ExperimentalPlanCreate(ExperimentalPlanBase):
    id: Optional[UUID] = None

@dataclass(kw_only=True)
class ExperimentalPlan(ExperimentalPlanBase, RecordMetadata):
    id: UUID


@dataclass(kw_only=True)
class WorkUnitBase(ResourceContainer):
    lab_type: LabType
    technician: str

    summary: str

    start_date: Optional[date] = None
    end_date: Optional[date] = None

@dataclass(kw_only=True)
class WorkUnitCreate(WorkUnitBase):
    id: Optional[UUID] = None

@dataclass(kw_only=True)
class WorkUnit(WorkUnitBase, RecordMetadata):
    id: UUID
    