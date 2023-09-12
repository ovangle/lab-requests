from __future__ import annotations

from abc import ABC, abstractmethod
import dataclasses
from datetime import datetime
from typing import Any, Callable, ClassVar, Generic, Iterable, Optional, Type, TypeVar, cast, dataclass_transform
from pydantic import BaseModel, ConfigDict, Field
from pydantic.dataclasses import dataclass
from sqlalchemy import Select, func
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
    def from_model(cls: Type[TApiModel], model: TModel | ModelOf[TApiModel]) -> TApiModel:
        raise NotImplementedError

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
        return self._api_model.from_model(updated_model)


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
        return self._api_model.from_model(created)


TItem = TypeVar('TItem', bound=ApiModel[Any])


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
    async def from_selection(cls, item_type: Type[TItem], db: LocalSession, select: Select[tuple[TModel]]):
        total_item_count = await db.scalar(func.count().select_from(select))
        results = await db.scalars(select)

        # No paging is actually performed yet.
        page_info = PageInfo(
            total_item_count=total_item_count or 0,
            page_size=20,
            page_index=0,
            start_index=0
        )

        return cls.from_page(item_type, list(results), page_info)

    @classmethod
    def from_page(cls, item_type: Type[TItem], page_items: list[TModel], page_info: PageInfo) -> PagedResultList[TItem]:
        return cls(
            items=[item_type.from_model(item) for item in page_items],
            total_item_count=page_info.total_item_count,
            page_index=page_info.page_index
        )



class CursorResultList(BaseModel, Generic[TItem]):
    items: list[TItem]

    cursor: str
    total_item_count: int