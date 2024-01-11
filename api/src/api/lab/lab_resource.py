from __future__ import annotations
import asyncio
from typing import Generic, Protocol, Self, TypeVar
from uuid import UUID

from sqlalchemy import Select
from sqlalchemy.ext.asyncio import async_object_session
from db import LocalSession

from db.models.lab import LabResource
from db.models.lab.lab_resource import LabResourceType
from ..base.schemas import ModelLookup, ModelView, ModelIndex

TResource = TypeVar("TResource", bound=LabResource)


class LabResourceView(ModelView[TResource], Generic[TResource]):
    type: LabResourceType
    lab_id: UUID

    @classmethod
    async def from_model(cls, model: TResource, **kwargs):
        return cls(type=model.type, lab_id=model.lab_id, **kwargs)


class LabResourceIndex(ModelIndex[TResource], Generic[TResource]):
    pass


class LabResourceLookup(ModelLookup[TResource], Generic[TResource]):
    id: UUID

    async def get(self, db: LocalSession):
        raise NotImplementedError
