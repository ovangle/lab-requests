from __future__ import annotations
from typing import Generic, TypeVar
from uuid import UUID

from db import LocalSession

from db.models.lab import LabResource
from db.models.lab.lab_resource import LabResourceType
from ..base.schemas import ModelLookup, ModelView, ModelIndex

TModelView = TypeVar("TModelView", bound=ModelView)
TResource = TypeVar("TResource", bound=LabResource)


class LabResourceView(ModelView[TResource], Generic[TResource]):
    type: LabResourceType
    lab_id: UUID

    @classmethod
    async def from_model(cls, model: TResource, **kwargs):
        return cls(type=model.type, lab_id=model.lab_id, **kwargs)


class LabResourceIndex(
    ModelIndex[TModelView, TResource], Generic[TModelView, TResource]
):
    __abstract__ = True


class LabResourceLookup(ModelLookup[TResource], Generic[TResource]):
    id: UUID

    async def get(self, db: LocalSession):
        raise NotImplementedError
