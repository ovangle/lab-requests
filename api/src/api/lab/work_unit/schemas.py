from datetime import date
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from pydantic import BaseModel

from db import LocalSession
from api.base.schemas import ApiModel, ModelPatch, ModelCreate
from api.uni.schemas import Campus, CampusCode
from api.lab.types import LabType

from .resource.schemas import ResourceContainer, ResourceContainerPatch

if TYPE_CHECKING:
    from . import models

class WorkUnitBase(BaseModel):
    lab_type: LabType
    technician: str

    process_summary: str

    start_date: Optional[date] = None
    end_date: Optional[date] = None


class WorkUnit(WorkUnitBase, ResourceContainer, ApiModel[models.WorkUnit_]):
    plan_id: UUID
    id: UUID

    # The index of the work unit in the parent plan
    index: int
    campus: Campus

    @classmethod
    async def from_model(cls, model: models.WorkUnit_):
        m_campus = await model.awaitable_attrs.campus

        instance = cls(
            plan_id=model.plan_id,
            id=model.id,
            index=model.index,
            campus=await Campus.from_model(m_campus),
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
        items = await db.scalars(models.WorkUnit_.list_for_experimental_plan(db, plan_id))
        return [await cls.from_model(item) for item in items]

    @classmethod
    async def get_by_id(cls, db: LocalSession, id: UUID):
        return await cls.from_model(await models.WorkUnit_.get_by_id(db, id))

    @classmethod
    async def get_by_plan_and_index(cls, db: LocalSession, plan: UUID, index: int):
        return await cls.from_model(await models.WorkUnit_.get_by_plan_and_index(db, plan, index))


class WorkUnitPatch(WorkUnitBase, ResourceContainerPatch, ModelPatch[WorkUnit]):
    __api_model__ = WorkUnit

    async def apply(self, db: LocalSession, model: models.WorkUnit_):
        for attr in ('lab_type', 'technician_email', 'process_summary', 
                     'start_date', 'end_date'):
            s_attr = getattr(self, attr)
            if getattr(model, attr) != s_attr:
                setattr(model, attr, getattr(self, attr))
                db.add(model)

class WorkUnitCreate(WorkUnitBase, ModelCreate[WorkUnit]):
    __api_model__ = WorkUnit
    plan_id: UUID

    async def do_create(self, db: LocalSession) -> models.WorkUnit_:
        instance = models.WorkUnit_(self.plan_id)
        db.add(instance)
        return instance

