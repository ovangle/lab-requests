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
    Awaitable,
    Callable,
    ClassVar,
    Generic,
    Iterable,
    Optional,
    Type,
    TypeVar,
    cast,
    dataclass_transform,
)
from uuid import UUID

from fastapi import UploadFile
from humps import camelize
from pydantic import BaseModel as _BaseModel, Field, ConfigDict
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


TModel = TypeVar("TModel", bound=Base)
TModelResponse = TypeVar("TApiModel", bound="ModelResponse")


class ModelResponse(BaseModel, Generic[TModel], ABC):
    created_at: datetime
    updated_at: datetime

    @classmethod
    @abstractmethod
    async def from_model(cls: type[TModelResponse], model: TModel) -> TModelResponse:
        ...


class ModelCreateRequest(BaseModel, Generic[TModel]):
    pass


class ModelUpdateRequest(BaseModel, Generic[TModel]):
    pass


class PagedModelResponse(BaseModel, Generic[TModel]):
    item_type: ClassVar[type[ModelResponse]]

    @classmethod
    def __init_subclass__(cls):
        if not (
            isinstance(cls.item_type, type) and issubclass(cls.item_type, ModelResponse)
        ):
            raise TypeError(
                f"PagedModelResponse subclass {cls.__name__} must declare an 'item_type'"
            )
        return super().__init_subclass__()

    total_item_count: int
    total_page_count: int
    page_index: int
    page_size: int

    items: list[ModelResponse[TModel]]

    @classmethod
    async def _gather_items(cls, selected_items: ScalarResult[tuple[TModel]]):
        item_responses = [cls.item_type.from_model(item) for item in selected_items]
        return await asyncio.gather(*item_responses)

    @classmethod
    async def from_select(
        cls,
        db: LocalSession,
        selection: Select[tuple[TModel]],
        *,
        page_index: int = 0,
        page_size: int | None = None,
    ):
        page_size = page_size or api_settings.api_page_size_default
        total_item_count = (
            await db.scalar(
                selection.order_by(None).with_only_columns(func.count()),
                maintain_column_froms=True,
            )
            or 0
        )
        total_page_count = total_item_count // page_size

        selection = selection.offset(page_index * page_size).limit(page_size)
        items = await cls._gather_items(await db.scalars(selection))
        return cls(
            items=items,
            total_item_count=total_item_count,
            total_page_count=total_page_count,
            page_index=page_index,
            page_size=page_size,
        )
