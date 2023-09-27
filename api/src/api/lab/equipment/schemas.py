from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID
from fastapi import HTTPException

from pydantic import BaseModel

from db import LocalSession
from api.base.schemas import ApiModel, ModelCreate, ModelPatch

from ..types import LabType
from . import models

class EquipmentTagBase(BaseModel):
    id: UUID | None
    name: str

class EquipmentTag(EquipmentTagBase, ApiModel[models.EquipmentTag]):
    id: UUID

    @classmethod
    def from_model(cls, equipment: EquipmentTag | models.EquipmentTag):
        return cls(
            id=equipment.id,
            name=equipment.name,
            created_at=equipment.created_at,
            updated_at=equipment.updated_at
        )

    async def to_model(self, db: LocalSession):
        return await models.EquipmentTag.fetch_for_id(db, self.id)

class EquipmentTagPatch(EquipmentTagBase, ModelPatch[EquipmentTag, models.EquipmentTag]):
    async def do_update(self, db: LocalSession, tag: models.EquipmentTag):
        if self.id and self.id != tag.id:
            raise HTTPException(409, 'Mismatched tags')
        if tag.name != self.name:
            tag.name = self.name
            db.add(tag)
        

class EquipmentTagCreate(EquipmentTagBase, ModelCreate[EquipmentTag, models.EquipmentTag]):
    async def do_create(self, db: LocalSession):
        instance = models.EquipmentTag(id=self.id, name=self.name)
        db.add(instance)
        return instance


class EquipmentBase(BaseModel):
    name: str
    description: str

    training_descriptions: list[str]
    tags: set[str]

class Equipment(EquipmentBase, ApiModel[models.Equipment]):
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
            updated_at=equipment.updated_at
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



