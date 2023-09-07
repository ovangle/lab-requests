from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Generic, Optional, TypeVar, dataclass_transform
from pydantic import ConfigDict
from pydantic.dataclasses import dataclass
from api.utils.db import LocalSession

from humps import camelize

from . import models 

SCHEMA_CONFIG = ConfigDict(
    alias_generator=camelize
)

@dataclass_transform(kw_only_default=True)
def api_dataclass(
    kw_only: bool = True,
    config: Optional[ConfigDict] = None
):
    config = config or ConfigDict()
    config.update(SCHEMA_CONFIG)
    return dataclass(
        kw_only=kw_only,
        config=config
    )

TModel = TypeVar('TModel', bound=models.Base)

@api_dataclass()
class ApiModel(Generic[TModel], ABC):
    created_at: datetime
    updated_at: datetime

    def __new__(cls, model: Optional[TModel] = None, **kwargs):
        if model is not None:
            return cls.from_model(model)
        return super().__new__(cls, **kwargs)

    @abstractmethod
    @classmethod
    def from_model(cls, model: TModel) -> ApiModel:
        raise NotImplementedError

class ModelPatch(Generic[TModel], ABC):
    @abstractmethod
    async def apply_to_model(self, model: TModel, db: LocalSession):
        raise NotImplementedError

class ModelCreate(Generic[TModel], ABC):
    @abstractmethod
    async def create_model(self, db: LocalSession) -> TModel:
        raise NotImplementedError






T = TypeVar('T')

@api_dataclass()
class PagedResultList(Generic[T]):
    items: list[T]

    total_item_count: int
    page_index: int = 0


@api_dataclass()
class CursorResultList(Generic[T]):
    items: list[T]

    cursor: str
    total_item_count: int