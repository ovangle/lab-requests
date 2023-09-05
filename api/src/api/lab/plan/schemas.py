from __future__ import annotations
from dataclasses import field
from uuid import UUID

from datetime import date, datetime
from typing import Optional
from pydantic.dataclasses import dataclass
from api.base.schemas import Record, RecordCreateRequest, RecordUpdateRequest, api_dataclass

from api.uni.schemas import Campus, CampusCode
from api.lab.types import LabType
from api.lab.resource.schemas import ResourceContainer, ResourceContainerPatch
from .types import FundingType

from . import models

@api_dataclass()
class WorkUnitPatch(ResourceContainerPatch):
    lab_type: LabType
    technician_email: str

    process_summary: str

    start_date: Optional[date] = None
    end_date: Optional[date] = None

    def apply(self, model: models.WorkUnit):
        model.lab_type = self.lab_type
        model.technician_email = self.technician_email
        model.process_summary = self.process_summary
        model.start_date = self.start_date
        model.end_date = self.end_date

@api_dataclass()
class CreateWorkUnitRequest(WorkUnitPatch, RecordCreateRequest):
    plan_id: UUID

    def create(self) -> models.WorkUnit:
        instance = models.WorkUnit(plan_id=self.plan_id)
        self.apply(instance)
        return instance

@api_dataclass()
class UpdateWorkUnitRequest(WorkUnitPatch, RecordUpdateRequest):
    id: UUID

@api_dataclass()
class WorkUnit(WorkUnitPatch, Record):
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

   