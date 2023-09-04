from __future__ import annotations

from typing import TYPE_CHECKING, Optional
from uuid import UUID
from pydantic import TypeAdapter
from pydantic.dataclasses import dataclass

from .types import CampusCode

if TYPE_CHECKING:
    from . import models

@dataclass(kw_only=True, config={'from_attributes': True, 'arbitrary_types_allowed': True})
class CampusBase:
    name: str

@dataclass(kw_only=True)
class CampusCreate(CampusBase):
    id: Optional[UUID] = None
    code: CampusCode

@dataclass(kw_only=True)
class Campus(CampusBase):
    id: UUID
    code: CampusCode

    @classmethod
    def from_model(cls, model: models.Campus):
        return cls(
            id=model.id,
            code=model.code,
            name=model.name,
        )

@dataclass(kw_only=True)
class CampusPatch(CampusBase):
    pass