from __future__ import annotations


from typing import TYPE_CHECKING
from typing_extensions import override
from uuid import UUID
from fastapi import HTTPException

from pydantic import BaseModel

from db import LocalSession
from db.models.uni import Discipline
from db.models.lab import LabEquipment
from api.base.schemas import ModelView, ModelLookup, ModelCreateRequest


class EquipmentBase(BaseModel):
    name: str
    description: str

    training_descriptions: list[str]
    tags: set[str]


class LabEquipmentView(ModelView[LabEquipment]):
    id: UUID

    @classmethod
    async def from_model(cls, equipment: Equipment | models.Equipment):
        return cls(
            id=equipment.id,
            name=equipment.name,
            description=equipment.description,
            training_descriptions=list(equipment.training_descriptions),
            tags=set(equipment.tags),
            created_at=equipment.created_at,
            updated_at=equipment.updated_at,
        )

    async def to_model(self, db: LocalSession):
        return models.Equipment.get_for_id(db, self.id)

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        model = await models.Equipment.get_for_id(db, id)
        return await cls.from_model(model)


class EquipmentRequest(BaseModel):
    """
    Represents a request to create an equipment
    """

    name: str
    description: str


class EquipmentPatch(EquipmentBase, ModelPatch[Equipment, models.Equipment]):
    __api_model__ = Equipment

    async def do_update(self, db: LocalSession, model: models.Equipment):
        if model.name != self.name:
            model.name = self.name
            db.add(model)

        if model.description != self.description:
            model.description = self.description
            db.add(model)

        if model.training_descriptions != self.training_descriptions:
            model.training_descriptions = list(self.training_descriptions)
            db.add(model)

        if set(model.tags) != self.tags:
            model.tags = sorted(self.tags)
            db.add(model)
        return model


class EquipmentCreate(EquipmentBase, ModelCreate[Equipment, models.Equipment]):
    __api_model__ = Equipment

    async def do_create(self, db: LocalSession):
        equipment = models.Equipment(**self.model_dump())
        db.add(equipment)
        return equipment
