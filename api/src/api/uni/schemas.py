from __future__ import annotations

from typing import TYPE_CHECKING, Optional
from uuid import UUID
from pydantic import ConfigDict, TypeAdapter
from pydantic.dataclasses import dataclass

from api.base.schemas import SCHEMA_CONFIG, RecordCreateRequest, RecordMetadata, api_dataclass

from .types import CampusCode

if TYPE_CHECKING:
    from . import models

@api_dataclass()
class CampusBase:
    code: CampusCode
    name: str

@api_dataclass()
class CampusCreateRequest(CampusBase, RecordCreateRequest):
    pass

@api_dataclass()
class Campus(CampusBase, RecordMetadata):
    id: UUID

    @classmethod
    def from_model(cls, model: models.Campus):
        return cls(
            id=model.id,
            code=model.code,
            name=model.name,
            created_at=model.created_at,
            updated_at=model.updated_at
        )

@dataclass(kw_only=True)
class CampusPatch(CampusBase):
    pass