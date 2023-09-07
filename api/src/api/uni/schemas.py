from __future__ import annotations

from typing import TYPE_CHECKING, Optional
from uuid import UUID
from pydantic import ConfigDict, TypeAdapter
from pydantic.dataclasses import dataclass

from api.base.schemas import SCHEMA_CONFIG, ApiModel, ModelPatch, ModelCreate, api_dataclass
from api.utils.db import LocalSession

from .types import CampusCode

if TYPE_CHECKING:
    from . import models

@api_dataclass()
class CampusBase:
    name: str

@api_dataclass()
class CampusPatch(CampusBase, ModelPatch[models.Campus]):
    async def apply_to_model(self, db: LocalSession, model: models.Campus):
        if model.name != self.name:
            model.name = self.name
            db.add(model)
        return model

@api_dataclass()
class CampusCreate(CampusPatch, ModelCreate[models.Campus]):
    code: CampusCode

    async def do_create(self, db: LocalSession):
        instance = models.Campus(code=self.code)
        await self.apply_to_model(db, instance)




@api_dataclass()
class Campus(CampusBase, ApiModel[models.Campus]):
    id: UUID
    code: CampusCode

    @classmethod
    def from_model(cls, model: models.Campus):
        return cls(
            id=model.id,
            code=model.code,
            name=model.name,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
