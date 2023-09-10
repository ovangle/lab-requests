from __future__ import annotations
from dataclasses import field
import dataclasses
from uuid import UUID

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic.dataclasses import dataclass
from api.base.schemas import ApiModel, ModelCreate, ModelPatch

from api.uni.errors import CampusDoesNotExist
from api.uni.schemas import Campus, CampusCode
from api.lab.types import LabType
from api.uni.types import Discipline
from api.utils.db import LocalSession

from .resource.schemas import ResourceContainer, ResourceContainerPatch
from .funding.schemas import ExperimentalPlanFundingModel, ExperimentalPlanFundingModelCreate, ExperimentalPlanFundingModelPatch
from . import models

class WorkUnitBase(BaseModel):
    lab_type: LabType
    technician: str

    process_summary: str

    start_date: Optional[date] = None
    end_date: Optional[date] = None

class WorkUnitPatch(WorkUnitBase, ResourceContainerPatch, ModelPatch[models.WorkUnit]):

    async def apply(self, db: AsyncSession, model: models.WorkUnit):
        for attr in ('lab_type', 'technician_email', 'process_summary', 
                     'start_date', 'end_date'):
            s_attr = getattr(self, attr)
            if getattr(model, attr) != s_attr:
                setattr(model, attr, getattr(self, attr))
                db.add(model)

class WorkUnitCreate(WorkUnitBase, ModelCreate[models.WorkUnit]):
    plan_id: UUID

    async def do_create(self, db: LocalSession) -> models.WorkUnit:
        instance = models.WorkUnit(plan_id=self.plan_id)
        db.add(instance)
        return instance

    async def __call__(self, db: LocalSession) -> WorkUnit:
        instance = await self.do_create(db)
        await db.commit()
        return WorkUnit.from_model(instance)


class WorkUnit(WorkUnitBase, ResourceContainer, ApiModel[models.WorkUnit]):
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
            technician=model.technician_email,
            process_summary=model.process_summary,
            start_date=model.start_date,
            end_date=model.end_date,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
        instance = super()._init_from_model(instance, model)
        return instance

    @classmethod
    async def list_for_experimental_plan(cls, db: LocalSession, plan_id: UUID):
        modelList = await models.WorkUnit.list_for_experimental_plan(db, plan_id)
        return list(map(cls.from_model, modelList))

    @classmethod
    async def get_by_id(cls, db: LocalSession, id: UUID):
        return cls.from_model(await models.WorkUnit.get_by_id(db, id))

    @classmethod
    async def get_by_plan_and_index(cls, db: LocalSession, plan: UUID, index: int):
        return cls.from_model(await models.WorkUnit.get_by_plan_and_index(db, plan, index))

class ExperimentalPlanBase(BaseModel):
    process_summary: str

    researcher: str
    supervisor: Optional[str] = None

           
class ExperimentalPlanPatch(ExperimentalPlanBase, ModelPatch):
    campus: CampusCode | UUID
    funding_model: ExperimentalPlanFundingModelCreate | UUID | None

    async def __call__(self, db: LocalSession, instance: models.ExperimentalPlan) -> ExperimentalPlan:
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

        if isinstance(self.funding_model, UUID):
            if self.funding_model != instance.funding_model_id:
                funding_model = models.ExperimentalPlanFundingModel.fetch_by_id(db, self.funding_model)
                instance.funding_model_id = self.funding_model
            
        elif isinstance(self.funding_model, ExperimentalPlanFundingModelCreate):
            funding_model = await models.ExperimentalPlanFundingModel.create


        if self.process_summary != instance.process_summary:
            instance.process_summary = self.process_summary
            db.add(instance)
        
        if self.researcher != instance.researcher_email:
            instance.researcher_email = self.researcher
            db.add(instance)
        
        if self.supervisor != instance.supervisor_email:
            instance.supervisor_email = self.supervisor
            db.add(instance)

        return ExperimentalPlan.from_model(instance)

class ExperimentalPlanCreate(ExperimentalPlanPatch, ModelCreate[models.ExperimentalPlan]):
    # Work units can be provided on plan create but not on other 
    work_units: list[WorkUnitPatch] = field(default_factory=list)

    async def __call__(self, db: LocalSession) -> ExperimentalPlan: 
        instance = models.ExperimentalPlan()

        if not list(instance.work_units):
            raise ValueError('Can not be applied after work units created')

        work_units = []
        for patch in self.work_units:
            create_request = WorkUnitCreate(plan_id=instance.id, **dataclasses.asdict(patch))
            await create_request(db)

        db.add(instance)

        return await super().__call__(db, instance)

class ExperimentalPlan(ExperimentalPlanBase, ApiModel[models.ExperimentalPlan]):
    id: UUID

    funding_model_id: UUID
    funding_model: ExperimentalPlanFundingModel

    researcher_base_campus_id: UUID
    researcher_base_campus: Campus
    researcher_discipline: Discipline

    work_units: list[WorkUnit]

    @classmethod
    def from_model(cls, model: models.ExperimentalPlan) -> ExperimentalPlan:
        return cls(
            id=model.id,
            funding_model_id=model.funding_model_id,
            funding_model=model.funding_model,
            researcher=model.researcher_email,
            supervisor=model.supervisor_email,

            researcher_base_campus_id=model.base_campus_id,
            researcher_base_campus=Campus.from_model(model.campus),
            researcher_discipline=model.researcher_discipline,
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

    @classmethod
    async def all(cls, db: AsyncSession):
        return [cls.from_model(instance) for instance in await models.ExperimentalPlan.all(db)]




   