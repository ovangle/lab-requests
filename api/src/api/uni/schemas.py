from __future__ import annotations
from enum import Enum

from typing import TYPE_CHECKING, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, TypeAdapter
from pydantic.dataclasses import dataclass

from api.base.schemas import SCHEMA_CONFIG, ApiModel, ModelPatch, ModelCreate
from db import LocalSession

from .types import CampusCode
from . import models


class CampusBase(BaseModel):
    name: str

    def _set_model_fields(self, model: models.Campus) -> bool:
        is_modified = False

        if model.name != self.name:
            model.name = self.name
            is_modified = True

        return is_modified


class Campus(CampusBase, ApiModel[models.Campus]):
    id: UUID
    code: CampusCode

    @classmethod
    async def from_model(cls, model: Campus | models.Campus):
        return cls(
            id=model.id,
            code=model.code,
            name=model.name,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def to_model(self, db: LocalSession):
        return await models.Campus.get_for_id(db, self.id)

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        return await cls.from_model(await models.Campus.get_for_id(db, id))

    @classmethod
    async def get_for_campus_code(cls, db: LocalSession, code: CampusCode):
        return await cls.from_model(await models.Campus.get_for_campus_code(db, code))


class CampusPatch(CampusBase, ModelPatch[Campus, models.Campus]):
    __api_model__ = Campus

    async def do_update(
        self, db: LocalSession, instance: models.Campus
    ) -> models.Campus:
        is_modified = self._set_model_fields(instance)
        if is_modified:
            db.add(instance)
        return instance


class CampusCreate(CampusBase, ModelCreate[Campus, models.Campus]):
    __api_model__ = Campus

    code: CampusCode

    async def do_create(self, db: LocalSession):
        from . import models

        instance = models.Campus(self.code)
        self._set_model_fields(instance)
        db.add(instance)
        return instance
