from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import TYPE_CHECKING, Any, Optional
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import func, select

# from api.base.files.schemas import StoredFile
from db.models.lab import LabWorkUnit

from db import LocalSession
from db.models.uni import Discipline, Campus

from ...base.schemas import ModelIndexPage, ModelView, ModelIndex
from ...uni.schemas import CampusLookup, lookup_campus, CampusView

# from api.base.schemas import ApiModel, ModelPatch, ModelCreate
# from api.uni.schemas import Campus, CampusCode
# from api.lab.types import LabType

# from .resource.schemas import ResourceContainer, ResourceContainerPatch
# from . import models


class WorkUnitView(ModelView[LabWorkUnit]):
    id: UUID
    plan_id: UUID

    # The index of the work unit in the parent plan
    index: int
    campus: CampusView

    @classmethod
    async def from_model(cls, model: LabWorkUnit):
        raise NotImplementedError
        if False:
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


class WorkUnitIndex(ModelIndex[WorkUnitView, LabWorkUnit]):
    __item_view__ = WorkUnitView


# TODO: PEP 695
WorkUnitIndexPage = ModelIndexPage[WorkUnitView, LabWorkUnit]


# class WorkUnitFileAttachment(StoredFile):
#     id: UUID

#     work_unit_id: UUID
