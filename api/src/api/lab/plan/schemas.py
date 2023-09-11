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
from api.uni.research.schemas import FundingModel, FundingModelCreate
from api.uni.schemas import Campus, CampusCode
from api.lab.types import LabType
from api.uni.types import Discipline
from api.utils.db import LocalSession

from .resource.schemas import ResourceContainer, ResourceContainerPatch
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
    funding_model: FundingModel | FundingModelCreate | UUID

    researcher: str
    researcher_base_campus: Campus | CampusCode | UUID
    researcher_discipline: Discipline

    supervisor: Optional[str] = None

    async def prepare_fields(self, db):
        if isinstance(self.researcher_base_campus, CampusCode):
            campus = await Campus.get_by_campus_code(db, self.researcher_base_campus)
            self.researcher_base_campus = campus

        if isinstance(self.funding_model, FundingModelCreate):
            self.funding_model = await self.funding_model.do_create(db)

    def _set_model_fields(self, instance: models.ExperimentalPlan) -> bool: 
        is_modified = False
        if self.process_summary != instance.process_summary:
            instance.process_summary = self.process_summary
            is_modified = True

        if self.researcher != instance.researcher_email: 
            instance.researcher_email = self.researcher
            is_modified = True
        
        print('researcher_base_campus: {0}'.format(self.researcher_base_campus))
        if isinstance(self.researcher_base_campus, (UUID, Campus)):
            campus_id = (
                self.researcher_base_campus.id 
                if isinstance(self.researcher_base_campus, Campus) 
                else self.researcher_base_campus
            )
            if campus_id != instance.researcher_base_campus_id:
                instance.researcher_base_campus_id = campus_id
                is_modified = True

        elif isinstance(self.researcher_base_campus, CampusCode):
            raise Exception('Must Prepare fields before create/commit')

        if self.researcher_discipline != instance.researcher_discipline:
            instance.researcher_discipline = self.researcher_discipline
            is_modified = True

        if self.supervisor != instance.supervisor_email:
            instance.supervisor_email = self.supervisor
            is_modified = True

        print('funding model: {0}'.format(self.funding_model))
        if isinstance(self.funding_model, (UUID, FundingModel)):
            funding_model_id = (
                self.funding_model 
                if isinstance(self.funding_model, UUID)
                else self.funding_model.id
            )
            if funding_model_id != instance.funding_model_id:
                instance.funding_model_id = funding_model_id
                is_modified = True
            
        elif isinstance(self.funding_model, FundingModelCreate):
            raise Exception('Did not prepare instance')
        
        else:
            raise ValueError('Unrecognised funding model')

        return is_modified


class ExperimentalPlanPatch(ExperimentalPlanBase, ModelPatch):
    async def do_update(self, db: LocalSession, instance: models.ExperimentalPlan) -> ExperimentalPlan:
        return ExperimentalPlan.from_model(instance)

class ExperimentalPlanCreate(ExperimentalPlanBase, ModelCreate[models.ExperimentalPlan]):
    funding_model: FundingModelCreate | UUID

    # Work units can be provided on plan create but not on other 
    work_units: list[WorkUnitPatch] = field(default_factory=list)

    async def do_create(self, db: LocalSession):
        await self.prepare_fields(db)

        instance = models.ExperimentalPlan()
        self._set_model_fields(instance)

        db.add(instance)
        if list(instance.work_units):
            raise ValueError('Can not be applied after work units created')

        work_units = []
        for work_unit in self.work_units:
            work_unit_create = WorkUnitCreate(plan_id=instance.id, **work_unit.model_dump())
            work_unit = await work_unit_create(db)
            work_units.append(work_unit)

        db.add(instance)

class ExperimentalPlan(ExperimentalPlanBase, ApiModel[models.ExperimentalPlan]):
    id: UUID

    funding_model_id: UUID
    funding_model: FundingModel

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




   