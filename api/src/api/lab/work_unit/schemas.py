from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import func, select
from api.base.files.schemas import StoredFile
from api.lab.work_unit.resource.models import ResourceContainerFileAttachment_

from db import LocalSession
from api.base.schemas import ApiModel, ModelPatch, ModelCreate
from api.uni.schemas import Campus, CampusCode
from api.lab.types import LabType

from .resource.schemas import ResourceContainer, ResourceContainerPatch
from . import models


class WorkUnitBase(BaseModel):
    campus: Campus | CampusCode | UUID

    name: str
    lab_type: LabType
    technician: str

    process_summary: str = ""

    start_date: Optional[date] = None
    end_date: Optional[date] = None


class WorkUnit(WorkUnitBase, ResourceContainer, ApiModel[models.WorkUnit_]):
    plan_id: UUID
    id: UUID

    # The index of the work unit in the parent plan
    index: int
    campus: Campus

    @classmethod
    async def from_model(cls, model: WorkUnit | models.WorkUnit_) -> WorkUnit:
        if isinstance(model, models.WorkUnit_):
            m_campus = await model.awaitable_attrs.campus
            campus = await Campus.from_model(m_campus)

            technician = model.technician_email
        else:
            campus = model.campus
            technician = model.technician

        instance = cls(
            plan_id=model.plan_id,
            id=model.id,
            name=model.name,
            index=model.index,
            campus=campus,
            lab_type=model.lab_type,
            technician=technician,
            process_summary=model.process_summary,
            start_date=model.start_date,
            end_date=model.end_date,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
        instance._set_resource_container_fields_from_model(model)
        return instance

    def to_model(self, db: LocalSession):
        return models.WorkUnit_.get_for_id(db, self.id)

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID) -> WorkUnit:
        return await cls.from_model(await models.WorkUnit_.get_for_id(db, id))

    @classmethod
    async def get_for_plan_and_index(
        cls, db: LocalSession, plan: UUID, index: int
    ) -> WorkUnit:
        return await cls.from_model(
            await models.WorkUnit_.get_for_plan_and_index(db, plan, index)
        )


class WorkUnitPatch(
    WorkUnitBase, ResourceContainerPatch, ModelPatch[WorkUnit, models.WorkUnit_]
):
    __api_model__ = WorkUnit

    async def do_update(
        self, db: LocalSession, model: models.WorkUnit_
    ) -> models.WorkUnit_:
        for attr in ("name", "lab_type", "process_summary", "start_date", "end_date"):
            s_attr = getattr(self, attr)
            if getattr(model, attr) != s_attr:
                setattr(model, attr, getattr(self, attr))
                db.add(model)

        if model.technician_email != self.technician:
            model.technician_email = self.technician
            db.add(model)

        await self.update_model_resources(db, model)

        return model


class WorkUnitCreate(WorkUnitBase, ModelCreate[WorkUnit, models.WorkUnit_]):
    __api_model__ = WorkUnit
    plan_id: UUID

    async def _resolve_campus_id(self, db: LocalSession) -> UUID:
        match self.campus:
            case Campus():
                return self.campus.id
            case CampusCode():
                return (await Campus.get_for_campus_code(db, self.campus)).id
            case UUID():
                return self.campus
            case _:
                raise TypeError(f"Unexpected value for campus: {type(self.campus)}")

    async def next_plan_index(self, db: LocalSession) -> int:
        return (
            await db.scalars(
                select(func.count(models.WorkUnit_.id))
                .select_from(models.WorkUnit_)
                .where(models.WorkUnit_.plan_id == self.plan_id)
            )
        ).one()

    async def do_create(self, db: LocalSession) -> models.WorkUnit_:
        plan = await models.ExperimentalPlan_.get_by_id(db, self.plan_id)

        work_unit = models.WorkUnit_(
            plan_id=plan.id,
            index=await self.next_plan_index(db),
            name=self.name,
            campus_id=await self._resolve_campus_id(db),
            lab_type=self.lab_type,
            technician_email=self.technician,
            process_summary=self.process_summary,
            start_date=self.start_date,
            end_date=self.end_date,
        )
        db.add(work_unit)
        return work_unit


class WorkUnitFileAttachment(StoredFile):
    id: UUID

    work_unit_id: UUID
