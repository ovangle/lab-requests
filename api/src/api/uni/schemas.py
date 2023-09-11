from __future__ import annotations
from enum import Enum

from typing import TYPE_CHECKING, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, TypeAdapter
from pydantic.dataclasses import dataclass

from api.base.schemas import SCHEMA_CONFIG, ApiModel, ModelPatch, ModelCreate
from api.utils.db import LocalSession

from .types import CampusCode
from . import models

class CampusBase(BaseModel):
    name: str

class CampusPatch(CampusBase, ModelPatch[models.Campus]):
    async def apply_to_model(self, db: LocalSession, model: models.Campus):
        if model.name != self.name:
            model.name = self.name
            db.add(model)
        return model


class CampusCreate(CampusPatch, ModelCreate[models.Campus]):
    code: CampusCode

    async def do_create(self, db: LocalSession):
        from . import models
        instance = models.Campus(code=self.code)
        await self.apply_to_model(db, instance)

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

    @classmethod
    async def get_by_campus_code(cls, db: LocalSession, code: CampusCode):
        return cls.from_model(await models.Campus.get_for_campus_code(db, code))

