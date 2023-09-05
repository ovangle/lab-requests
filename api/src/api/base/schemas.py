from datetime import datetime
from typing import Generic, TypeVar
from pydantic.dataclasses import dataclass

@dataclass(kw_only=True)
class RecordMetadata:
    created_at: datetime
    updated_at: datetime

T = TypeVar('T')

@dataclass(kw_only=True)
class PagedResultList(Generic[T]):
    items: list[T]

    total_item_count: int
    page_index: int = 0

@dataclass(kw_only=True)
class CursorResultList(Generic[T]):
    items: list[T]

    cursor: str
    total_item_count: int