from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel
from db import LocalSession
from api.base.schemas import ApiModel, ModelCreate, ModelPatch

from ..types import LabType
from . import models

class EquipmentBase(BaseModel):
    name: str
    description: str

    available_in_lab_types: list[LabType]

    requires_training: bool
    training_descriptions: list[str]

class Equipment(EquipmentBase, ApiModel[models.Equipment]):
    id: UUID

    @classmethod
    async def from_model(cls, equipment: Equipment | models.Equipment):
        return cls(
            id=equipment.id,
            name=equipment.name,
            description=equipment.description,
            available_in_lab_types=equipment.available_in_lab_types,
            requires_training=equipment.requires_training,
            training_descriptions=equipment.training_descriptions,
            created_at=equipment.created_at,
            updated_at=equipment.updated_at
        )

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        model = await models.Equipment.get_for_id(db, id)
        return await cls.from_model(model)

class EquipmentPatch(EquipmentBase, ModelPatch[Equipment, models.Equipment]):
    __api_model__ = Equipment

    async def do_update(self, db: LocalSession, model: models.Equipment):
        if model.name != self.name:
            model.name = self.name
            db.add(model)

        if model.description != self.description:
            model.description = self.description
            db.add(model)
        return model

class EquipmentCreate(EquipmentBase, ModelCreate[Equipment, models.Equipment]):
    async def do_create(self, db: LocalSession):
        raise NotImplementedError()



