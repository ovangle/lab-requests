from datetime import datetime
from typing import Generic, Optional, TypeVar, dataclass_transform
from pydantic import ConfigDict
from pydantic.dataclasses import dataclass

from humps import camelize

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

@api_dataclass()
class RecordCreateRequest:
    pass

@api_dataclass()
class RecordUpdateRequest:
    pass

@api_dataclass()
class Record:
    created_at: datetime
    updated_at: datetime

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