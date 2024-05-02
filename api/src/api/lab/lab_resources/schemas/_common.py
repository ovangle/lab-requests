from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import Select

from db import LocalSession, local_object_session

from db.models.lab import LabResource
from db.models.lab.lab import Lab
from db.models.lab.lab_resource import LabResourceAttrs, LabResourceType
from api.base.schemas import (
    BaseModel,
    ModelIndexPage,
    ModelLookup,
    ModelView,
    ModelIndex,
)
from db.models.lab.lab_resource_container import LabResourceContainer

TResource = TypeVar("TResource", bound=LabResource)


class LabResourceView(ModelView[TResource], Generic[TResource]):
    type: LabResourceType
    lab_id: UUID

    @classmethod
    async def from_model(cls, model: TResource, **kwargs):
        return cls(type=model.type, lab_id=model.lab_id, **kwargs)


TModelView = TypeVar("TModelView", bound=LabResourceView)


class LabResourceIndexPage(ModelIndexPage[TModelView], Generic[TModelView]):
    # Non-null if we are indexing the items in a specific resource container.
    consumer_id: UUID | None = None


class LabResourceIndex(ModelIndex[TModelView], Generic[TModelView]):
    __abstract__ = True
    consumer_id: UUID | None = None

    def __init__(
        self,
        selection: Select[tuple[TResource]],
        *,
        consumer_id: UUID | None = None,
        page_size: int | None = None,
    ):
        self.consumer_id = consumer_id
        super().__init__(selection, page_size=page_size)

    async def load_page(
        self, db: LocalSession, page_index: int
    ) -> LabResourceIndexPage[TModelView]:
        model_page = await super().load_page(db, page_index)
        return LabResourceIndexPage(
            consumer_id=self.consumer_id,
            items=model_page.items,
            total_item_count=model_page.total_item_count,
            total_page_count=model_page.total_page_count,
            page_index=model_page.page_index,
            page_size=model_page.page_size,
        )


class LabResourceLookup(ModelLookup[TResource], Generic[TResource]):
    id: UUID

    async def get(self, db: LocalSession):
        raise NotImplementedError


class LabResourcePatch(BaseModel, ABC):
    lab: UUID

    @abstractmethod
    async def as_attrs(
        self, container: LabResourceContainer, index: int
    ) -> LabResourceAttrs:
        db = local_object_session(container)
        lab = await Lab.get_for_id(db, self.lab)
        return {"lab": lab, "container": container, "index": index}
