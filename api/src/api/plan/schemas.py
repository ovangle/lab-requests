from __future__ import annotations
from dataclasses import field
from uuid import UUID

from datetime import date, datetime
from typing import Optional
from pydantic.dataclasses import dataclass
from api.base.schemas import RecordMetadata

from api.uni.schemas import Campus, CampusCode, CampusCreate
from .types import FundingType, LabType
from .resource.schemas import ResourceContainer

from . import models

@dataclass(kw_only=True)
class ExperimentalPlanBase:
    funding_type: FundingType

    process_summary: str

    researcher_email: str
    supervisor_email: Optional[str] = None

           
@dataclass(kw_only=True)
class ExperimentalPlanCreate(ExperimentalPlanBase):
    id: Optional[UUID] = None
    campus: CampusCode | UUID
    work_units: list[WorkUnitCreate] = field(default_factory=list)

    def __post_init__(self):
        for work_unit in self.work_units:
            if work_unit.plan_id and work_unit.plan_id != self.id:
                raise ValueError(f"Cannot create nested work unit for {self.id}: work unit already exists for plan ${work_unit.plan_id}")

@dataclass(kw_only=True)
class ExperimentalPlanPatch(ExperimentalPlanBase):
    id: UUID

@dataclass(kw_only=True)
class ExperimentalPlan(ExperimentalPlanBase, RecordMetadata):
    id: UUID

    campus: Campus
    work_units: list[WorkUnit]


    @classmethod
    def from_model(cls, model: models.ExperimentalPlan) -> ExperimentalPlan:
        return cls(
            id=model.id,
            funding_type=model.funding_type,
            researcher_email=model.researcher_email,
            supervisor_email=model.supervisor_email,

            campus=Campus.from_model(model.campus),
            work_units=[WorkUnit.from_model(work_unit) for work_unit in model.work_units],

            process_summary=model.process_summary,
            created_at=model.created_at,
            updated_at=model.updated_at
        )


@dataclass(kw_only=True)
class WorkUnitBase(ResourceContainer):
    lab_type: LabType
    technician_email: str

    process_summary: str

    start_date: Optional[date] = None
    end_date: Optional[date] = None


@dataclass(kw_only=True)
class WorkUnitCreate(WorkUnitBase):
    plan_id: Optional[UUID] = None
    id: Optional[UUID] = None

    campus: CampusCode | CampusCreate


@dataclass(kw_only=True)
class WorkUnit(WorkUnitBase, RecordMetadata):
    plan_id: UUID
    id: UUID

    index: int
    campus: Campus

    @classmethod
    def from_model(cls, model: models.WorkUnit):
        instance = cls(
            plan_id=model.plan_id,
            id=model.id,
            index=model.index,
            campus=Campus.from_model(model.campus),
            lab_type=model.lab_type,
            technician_email=model.technician_email,
            process_summary=model.process_summary,
            start_date=model.start_date,
            end_date=model.end_date,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
        instance = super()._init_from_model(instance, model)
        return instance

class WorkUnitPatch(WorkUnitBase):
    id: UUID

    