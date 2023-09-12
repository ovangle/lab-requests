from __future__ import annotations
import asyncio

from asyncio.futures import Future
from abc import ABC, abstractmethod
import dataclasses
from datetime import datetime
import functools
from typing import Any, Awaitable, Callable, ClassVar, Generic, Iterable, Optional, Type, TypeVar, cast, dataclass_transform
from pydantic import BaseModel, ConfigDict, Field
from pydantic.dataclasses import dataclass
from sqlalchemy import Select, func, select
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
TApiModel = TypeVar('TApiModel', bound='ApiModel')

class ApiModel(BaseModel, Generic[TModel], ABC):
    model_config = SCHEMA_CONFIG

    created_at: datetime
    updated_at: datetime

    @classmethod
    @abstractmethod
    async def from_model(cls: Type[TApiModel], model: TModel | ModelOf[TApiModel]) -> TApiModel:
        raise NotImplementedError

    @classmethod
    async def gather_models(cls: Type[TApiModel], models: Iterable[TModel | ModelOf[TApiModel]]) -> list[TApiModel]:
        return await asyncio.gather(*(cls.from_model(m) for m in models))

class ModelOf(Generic[TApiModel], ABC):
    pass


class ModelPatch(BaseModel, Generic[TApiModel], ABC):
    __api_model__: ClassVar[Type[ApiModel]]
    model_config = SCHEMA_CONFIG

    @classmethod
    def from_create(cls, create_req: ModelPatch | ModelCreate):
        import dataclasses
        return cls(**create_req.model_dump())

    @property
    def _api_model(self) -> Type[TApiModel]:
        return cast(Type[TApiModel], type(self).__api_model__)

    @abstractmethod
    async def do_update(self, db: LocalSession, model: TModel) -> TModel:
        raise NotImplementedError

    async def __call__(self, db: LocalSession, model: Any) -> TApiModel:
        updated_model = await self.do_update(db, model)
        await db.commit()
        return await self._api_model.from_model(updated_model)


class ModelCreate(BaseModel, Generic[TApiModel], ABC):
    __api_model__: ClassVar[Type[ApiModel]]
    model_config = SCHEMA_CONFIG

    @property
    def _api_model(self) -> Type[TApiModel]:
        return cast(Type[TApiModel], type(self).__api_model__)

    @abstractmethod
    async def do_create(self, db: LocalSession) -> ModelOf[TApiModel]:
        raise NotImplementedError

    async def __call__(self, db: LocalSession) -> TApiModel:
        created = await self.do_create(db)
        await db.commit()
        return await self._api_model.from_model(created)


TItem = TypeVar('TItem', bound='ApiModel[Any]')


@dataclasses.dataclass(kw_only=True)
class PageInfo:
    page_size: int
    total_item_count: int

    page_index: int
    start_index: int


class PagedResultList(BaseModel, Generic[TItem]):
    items: list[TItem]

    total_item_count: int
    page_index: int = 0

    @classmethod
    async def from_selection(cls, item_type: Type[TItem], db: LocalSession, selection: Select[tuple[TModel]]):
        total_item_count = await db.scalar(
            selection.with_only_columns(func.count()).order_by(None)
        )
        results = await item_type.gather_models(await db.scalars(selection))

        return cls(
            items=results,
            total_item_count=total_item_count or 0,
            page_index=0
        )

    @classmethod
    def from_list(
        cls,
        items: list[TItem]
    ):
        return cls(items=items, total_item_count=len(items), page_index=0)
        

class CursorResultList(BaseModel, Generic[TItem]):
    items: list[TItem]

    cursor: str
    total_item_count: int