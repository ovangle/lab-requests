from __future__ import annotations
import asyncio
from dataclasses import field
import dataclasses
from uuid import UUID

from datetime import date, datetime
from typing import Iterable, Optional
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic.dataclasses import dataclass
from api.base.schemas import ApiModel, ModelCreate, ModelPatch, PagedResultList

from api.uni.errors import CampusDoesNotExist
from api.uni.research.schemas import FundingModel, FundingModelCreate
from api.uni.schemas import Campus, CampusCode
from api.lab.types import LabType
from api.uni.types import Discipline
from db import LocalSession

from api.lab.work_unit.schemas import WorkUnit, WorkUnitPatch, WorkUnitCreate
from . import models

class ExperimentalPlanBase(BaseModel):
    title: str

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
            create_req = self.funding_model
            self.funding_model = await create_req(db)

    def _set_model_fields(self, instance: models.ExperimentalPlan_) -> bool: 
        is_modified = False

        if self.title != instance.title:
            instance.title = self.title
            is_modified = True

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


class ExperimentalPlan(ExperimentalPlanBase, ApiModel[models.ExperimentalPlan_]):
    id: UUID
    title: str = Field(max_length=256)

    funding_model_id: UUID
    funding_model: FundingModel

    researcher_base_campus: Campus
    researcher_discipline: Discipline

    work_units: list[WorkUnit]

    @classmethod
    async def from_model(cls, model: ExperimentalPlan | models.ExperimentalPlan_) -> ExperimentalPlan:
        if isinstance(model, ExperimentalPlan):
            return cls(**model.model_dump())

        funding_model = await FundingModel.from_model(
            await model.awaitable_attrs.funding_model
        )

        researcher_base_campus = await Campus.from_model(
            await model.awaitable_attrs.researcher_base_campus
        )

        work_units = await WorkUnit.gather_models(
            await model.awaitable_attrs.work_units
        )

        return cls(
            id=model.id,
            title=model.title,
            funding_model_id=funding_model.id,
            funding_model=funding_model,
            researcher=model.researcher_email,
            supervisor=model.supervisor_email,

            researcher_base_campus=researcher_base_campus,
            researcher_discipline=model.researcher_discipline,
            work_units=work_units,

            process_summary=model.process_summary,
            created_at=model.created_at,
            updated_at=model.updated_at
        )

    async def to_model(self, db: LocalSession) -> models.ExperimentalPlan_:
        return await models.ExperimentalPlan_.get_by_id(db, self.id)

    @classmethod
    async def get_by_id(cls, db: LocalSession, id: UUID):
        return await cls.from_model(await models.ExperimentalPlan_.get_by_id(db, id))


class ExperimentalPlanPatch(ExperimentalPlanBase, ModelPatch[ExperimentalPlan, models.ExperimentalPlan_]):
    __api_model__ = ExperimentalPlan

    async def do_update(self, db: LocalSession, instance: models.ExperimentalPlan_) -> models.ExperimentalPlan_:
        await self.prepare_fields(db)

        self._set_model_fields(instance)
        db.add(instance)

        return instance

class ExperimentalPlanCreate(ExperimentalPlanBase, ModelCreate[ExperimentalPlan, models.ExperimentalPlan_]):
    __api_model__ = ExperimentalPlan
    add_work_units: list[WorkUnitPatch] = field(default_factory=list)

    async def do_create(self, db: LocalSession) -> models.ExperimentalPlan_:
        await self.prepare_fields(db)

        instance = models.ExperimentalPlan_()
        self._set_model_fields(instance)

        db.add(instance)
        if list(instance.work_units):
            raise ValueError('Can not be applied after work units created')

        new_work_units = []
        for work_unit in self.add_work_units:
            work_unit_create = WorkUnitCreate(plan_id=instance.id, **work_unit.model_dump())
            new_work_units.append(await work_unit_create(db))

        db.add(instance)
        return instance
