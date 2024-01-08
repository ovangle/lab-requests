from __future__ import annotations
import asyncio

from asyncio.futures import Future
from abc import ABC, abstractmethod
import dataclasses
from datetime import datetime
import functools
from pathlib import Path
from typing import (
    Any,
    ClassVar,
    Generic,
    Self,
    TypeVar,
)
from uuid import UUID

from humps import camelize
from pydantic import BaseModel as _BaseModel, ConfigDict
from sqlalchemy import ScalarResult, Select, func

from api.settings import api_settings

from db import LocalSession
from db.models import Base


class BaseModel(_BaseModel):
    model_config = ConfigDict(
        alias_generator=camelize,
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True,
    )


# FIXME: mypy doesn't support PEP 695 yet.
TModel = TypeVar("TModel", bound=Base)


class ModelResponse(BaseModel, Generic[TModel]):
    id: UUID
    created_at: datetime
    updated_at: datetime

    @classmethod
    @abstractmethod
    async def from_model(cls: type[Self], model: TModel, **kwargs) -> Self:
        return cls(
            created_at=model.created_at,
            updated_at=model.updated_at,
            **kwargs,
        )


class ModelCreateRequest(BaseModel, Generic[TModel]):
    @abstractmethod
    def do_create(self, db: LocalSession): TModel:
        ...


class ModelUpdateRequest(BaseModel, Generic[TModel]):
    @abstractmethod
    def do_update(self, model: TModel) -> TModel:
        ...


TModelResponse = TypeVar("TModelResponse", bound=ModelResponse)


class ModelResponsePage(BaseModel, Generic[TModel]):
    items: list[ModelResponse[TModel]]
    total_item_count: int
    total_page_count: int
    page_index: int
    page_size: int


class PagedModelResponse(Generic[TModel]):
    def __init__(
        self,
        db: LocalSession,
        item_type: type[ModelResponse[TModel]],
        selection: Select[tuple[TModel]],
        page_size: int | None = None,
    ):
        self.db = db
        self.item_type = item_type
        self.selection = selection
        self.page_size = page_size or api_settings.api_page_size_default

    async def _gather_items(self, selected_items: ScalarResult[TModel]):
        item_responses = [self.item_type.from_model(item) for item in selected_items]
        return await asyncio.gather(*item_responses)

    async def load_page(self, page_index: int):
        total_item_count = (
            await self.db.scalar(
                self.selection.order_by(None).with_only_columns(func.count()),
                maintain_column_froms=True,
            )
            or 0
        )
        total_page_count = total_item_count // self.page_size

        selection = self.selection.offset(page_index * self.page_size).limit(
            self.page_size
        )
        items = await self._gather_items(await self.db.scalars(selection))
        return ModelResponsePage(
            items=items,
            total_item_count=total_item_count,
            total_page_count=total_page_count,
            page_index=page_index,
            page_size=self.page_size,
        )
