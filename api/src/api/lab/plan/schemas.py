from __future__ import annotations
from dataclasses import field
from uuid import UUID

from datetime import date, datetime
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic.dataclasses import dataclass

from api.base.schemas import Record, RecordCreateRequest, RecordUpdateRequest, api_dataclass, PagedResultList
from api.uni.errors import CampusDoesNotExist
from api.uni.schemas import Campus, CampusCode
from api.lab.types import LabType

from .resource.schemas import ResourceContainer, ResourceContainerPatch
from . import models

@api_dataclass()
class WorkUnitBase:
    lab_type: LabType
    technician_email: str

    process_summary: str

    start_date: Optional[date] = None
    end_date: Optional[date] = None


@api_dataclass()
class WorkUnitPatch(ResourceContainerPatch):
    async def apply(self, db: AsyncSession, model: models.WorkUnit):
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
class WorkUnit(WorkUnitBase, ResourceContainer, Record):
    plan_id: UUID
    id: UUID

    # The index of the work unit in the parent plan
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

    @classmethod
    async def 

 
@dataclass(kw_only=True)
class ExperimentalPlanBase:
    funding_type: models.FundingType

    process_summary: str

    researcher_email: str
    supervisor_email: Optional[str] = None

           
@dataclass(kw_only=True)
class ExperimentalPlanPatch(ExperimentalPlanBase):
    campus: CampusCode | UUID

    async def __call__(self, db: AsyncSession, instance: models.ExperimentalPlan) -> ExperimentalPlan:
        if isinstance(self.campus, CampusCode):
            if instance.campus.code != self.campus:
                campus_id = (await db.execute(
                    select(models.Campus.id).where(models.Campus.code == self.campus)
                )).first()
                if not campus_id:
                    raise CampusDoesNotExist.for_code(self.campus)

                instance.campus_id = campus_id[0]
                db.add(instance)

        if isinstance(self.campus, UUID):
            if self.campus != instance.campus_id:
                instance.campus_id = self.campus
                db.add(instance)

        if self.funding_type != instance.funding_type:
            instance.funding_type = self.funding_type
            db.add(instance)

        if self.process_summary != instance.process_summary:
            instance.process_summary = self.process_summary
            db.add(instance)
        
        if self.researcher_email != instance.researcher_email:
            instance.researcher_email = self.researcher_email
            db.add(instance)
        
        if self.supervisor_email != instance.supervisor_email:
            instance.supervisor_email = self.supervisor_email
            db.add(instance)

        return ExperimentalPlan.from_model(instance)

@dataclass(kw_only=True)
class ExperimentalPlanCreate(ExperimentalPlanPatch):
    # Work units can be provided on plan create but not on other 
    work_units: list[WorkUnitPatch] = field(default_factory=list)

    async def __call__(self, db: AsyncSession) -> ExperimentalPlan: 
        instance = models.ExperimentalPlan()

        if not list(instance.work_units):
            raise ValueError('Can not be applied after work units created')

        work_units = [
            models.WorkUnit(plan_id=instance.id, index=i, **patch) 
            for (i, patch) in enumerate(self.work_units)
        ]

        db.add_all(work_units)
        db.add(instance)

        return await super().__call__(db, instance)

@dataclass(kw_only=True)
class ExperimentalPlan(ExperimentalPlanBase, Record):
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

    @classmethod
    async def get_by_id(cls, db: AsyncSession, id: UUID):
        return cls.from_model(await models.ExperimentalPlan.get_by_id(db, id))

    @classmethod
    async def list_for_researcher(cls, db: AsyncSession, researcher_email: str) -> list[ExperimentalPlan]:
        instances = await models.ExperimentalPlan.list_for_researcher(db, researcher_email)
        return list(map(cls.from_model, instances))

    @classmethod
    async def list_for_supervisor(cls, db: AsyncSession, supervisor_email: str) -> list[ExperimentalPlan]:
        instances = await models.ExperimentalPlan.list_for_supervisor(db, supervisor_email)
        return list(map(cls.from_model, instances))




   