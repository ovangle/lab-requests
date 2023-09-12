from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID
from api.base.schemas import ApiModel, ModelPatch

from ..types import LabType
from . import models

class EquipmentPatch(ModelPatch[models.Equipment]):
    name: str
    description: str

    available_in_lab_types: list[LabType]

    requires_training: bool
    training_descriptions: list[str]

class Equipment(EquipmentPatch, ApiModel[models.Equipment]):
    id: UUID

    @classmethod
    async def from_model(cls, equipment: models.Equipment):
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

