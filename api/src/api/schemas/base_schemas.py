from __future__ import annotations

from abc import abstractmethod
import asyncio
from datetime import datetime
from typing import Any, Awaitable, Callable, ClassVar, Generic, Self, TypeVar, TypedDict, cast
import typing
from uuid import UUID
from fastapi import Depends
from humps import camelize
from pydantic import BaseModel as _BaseModel, ConfigDict, Field
from pydantic._internal._forward_ref import PydanticRecursiveRef
from sqlalchemy import ScalarResult, Select, func

from db import LocalSession, get_db
from db.models.base import Base

from api.settings import api_settings


class BaseModel(_BaseModel):
    model_config = ConfigDict(
        alias_generator=camelize,
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True,
    )


# FIXME: mypy doesn't support PEP 695 yet.
TModel = TypeVar("TModel", bound=Base)


class ModelDetail(BaseModel, Generic[TModel]):
    id: UUID
    created_at: datetime
    updated_at: datetime

    @classmethod
    async def _from_base(cls, model: Base, **kwargs) -> Self:
        return cls(
            id=model.id,
            created_at=model.created_at,
            updated_at=model.updated_at,
            **kwargs,
        )

    # TODO: pass db explicitly to from_model?
    #       (saves calling local_object_session as first line of every non-trivial from_model)
    @classmethod
    @abstractmethod
    async def from_model(cls, model: TModel) -> Self: ...


class ModelLookup(BaseModel, Generic[TModel]):
    @abstractmethod
    async def get(self, db: LocalSession) -> TModel: ...


class ModelRequest(BaseModel, Generic[TModel]):
    pass


class ModelRequestContextError(Exception):
    def __init__(self, key: str):
        super().__init__(f"request context error: no value for {key}")


class ModelCreateRequest(ModelRequest[TModel], Generic[TModel]):
    @abstractmethod
    async def do_create(self, db: LocalSession, **kwargs) -> TModel:
        raise NotImplementedError


class ModelUpdateRequest(ModelRequest[TModel], Generic[TModel]):
    @abstractmethod
    async def do_update(self, model: TModel, **kwargs: Any) -> TModel: ...

TDetail = TypeVar("TDetail", bound=ModelDetail)


class ModelIndexPage(BaseModel, Generic[TModel, TDetail]):
    items: list[TDetail]
    total_item_count: int
    total_page_count: int
    page_index: int
    page_size: int

    @classmethod
    async def item_from_model(cls, item: TModel):
        raise NotImplementedError

    @classmethod
    async def from_selection(
        cls,
        db: LocalSession,
        selection: Select[tuple[TModel]],
        page_size: int = 20,
        page_index: int = 1,
    ) -> Self:
        if page_index <= 0:
            raise IndexError("Pages are 1-indexed")

        total_item_count = (
            await db.scalar(
                selection.order_by(None).with_only_columns(
                    func.count(), maintain_column_froms=True
                ),
            )
            or 0
        )
        total_page_count = total_item_count // page_size

        selection = selection.offset((page_index - 1) * page_size).limit(
            page_size
        )

        item_responses = [cls.item_from_model(item) for item in await db.scalars(selection)]
        items = await asyncio.gather(*item_responses)

        return cls(
            items=items,
            total_item_count=total_item_count,
            total_page_count=total_page_count,
            page_index=page_index,
            page_size=page_size,
        )
