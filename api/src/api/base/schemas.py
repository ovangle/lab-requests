from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Generic, Optional, TypeVar, cast, dataclass_transform
from pydantic import BaseModel, ConfigDict, Field
from pydantic.dataclasses import dataclass
from api.utils.db import LocalSession

from humps import camelize

from . import models 

SCHEMA_CONFIG = ConfigDict(
    alias_generator=camelize,
    populate_by_name=True,
    from_attributes=True,
    arbitrary_types_allowed=True
)

TModel = TypeVar('TModel', bound=models.Base)

class ApiModel(BaseModel, Generic[TModel], ABC):
    model_config = SCHEMA_CONFIG

    created_at: datetime
    updated_at: datetime

    @classmethod
    @abstractmethod
    def from_model(cls, model: Any) -> ApiModel:
        raise NotImplementedError

class ModelPatch(BaseModel, Generic[TModel], ABC):
    model_config = SCHEMA_CONFIG

    @classmethod
    def from_create(cls, create_req: ModelPatch | ModelCreate):
        import dataclasses
        return cls(**create_req.model_dump())

    @abstractmethod
    async def do_update(self, db: LocalSession, model: Any) -> TModel:
        raise NotImplementedError

    async def __call__(self, db: LocalSession, model: TModel) -> TModel:
        updated = await self.do_update(db, model)
        await db.commit()
        return updated


class ModelCreate(BaseModel, Generic[TModel], ABC):
    model_config = SCHEMA_CONFIG

    @abstractmethod
    async def do_create(self, db: LocalSession) -> TModel:
        raise NotImplementedError

    async def __call__(self, db: LocalSession) -> TModel:
        instance = await self.do_create(db)
        await db.commit()
        return instance


TItem = TypeVar('TItem', bound=ApiModel[Any])

class PagedResultList(BaseModel, Generic[TItem]):
    items: list[TItem]

    total_item_count: int
    page_index: int = 0


class CursorResultList(BaseModel, Generic[TItem]):
    items: list[TItem]

    cursor: str
    total_item_count: int