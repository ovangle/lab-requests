from abc import abstractmethod
import asyncio
from datetime import datetime
from typing import ClassVar, Generic, Self, TypeVar, cast
from uuid import UUID
from humps import camelize
from pydantic import BaseModel as _BaseModel, ConfigDict
from sqlalchemy import ScalarResult, Select, func

from db import LocalSession
from db.models import Base

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


class ModelView(BaseModel, Generic[TModel]):
    id: UUID
    created_at: datetime
    updated_at: datetime

    @classmethod
    @abstractmethod
    async def from_model(cls: type[Self], model: TModel) -> Self:
        ...


class ModelLookup(BaseModel, Generic[TModel]):
    @abstractmethod
    async def get(self, db: LocalSession) -> TModel:
        ...


class ModelCreateRequest(BaseModel, Generic[TModel]):
    @abstractmethod
    async def do_create(self, db: LocalSession, **kwargs) -> TModel:
        ...


class ModelUpdateRequest(BaseModel, Generic[TModel]):
    @abstractmethod
    async def do_update(self, model: TModel, **kwargs) -> TModel:
        ...


TModelView = TypeVar("TModelView", bound=ModelView)


class ModelIndexPage(BaseModel, Generic[TModelView]):
    items: list[TModelView]
    total_item_count: int
    total_page_count: int
    page_index: int
    page_size: int


class ModelIndex(Generic[TModelView]):
    __abstract__: ClassVar[bool]
    __item_view__: ClassVar[type[ModelView]]

    item_view: type[TModelView]

    def __init_subclass__(cls) -> None:
        # We don't want subclasses inheriting __abstract__
        is_abstract = cls.__dict__.get("__abstract__", False)

        if not is_abstract and not issubclass(cls.__item_view__, ModelView):
            raise ValueError("Class must declare an item_view type")

        return super().__init_subclass__()

    def __init__(
        self,
        selection: Select[tuple[TModel]],
        *,
        page_size: int | None = None,
    ):
        self.item_view = cast(type[TModelView], type(self).__item_view__)
        self.selection = selection
        self.page_size = page_size or api_settings.api_page_size_default

    async def _gather_items(
        self, selected_items: ScalarResult[TModel]
    ) -> list[TModelView]:
        item_responses = [self.item_view.from_model(item) for item in selected_items]
        return await asyncio.gather(*item_responses)

    async def load_page(
        self, db: LocalSession, page_index: int
    ) -> ModelIndexPage[TModelView]:
        if page_index <= 0:
            raise IndexError("Pages are 1-indexed")
        total_item_count = (
            await db.scalar(
                self.selection.order_by(None).with_only_columns(
                    func.count(), maintain_column_froms=True
                ),
            )
            or 0
        )
        total_page_count = total_item_count // self.page_size

        selection = self.selection.offset((page_index - 1) * self.page_size).limit(
            self.page_size
        )
        items = await self._gather_items(await db.scalars(selection))
        return ModelIndexPage[TModelView](
            items=items,
            total_item_count=total_item_count,
            total_page_count=total_page_count,
            page_index=page_index,
            page_size=self.page_size,
        )
