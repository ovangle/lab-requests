from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID
from api.base.schemas import api_dataclass, Record

from ..types import LabType

if TYPE_CHECKING:
    from . import models

@api_dataclass()
class EquipmentPatch:
    name: str
    description: str

    available_in_lab_types: list[LabType]

    requires_training: bool
    training_descriptions: list[str]

@api_dataclass()
class Equipment(EquipmentPatch, Record):
    id: UUID

    @classmethod
    def from_model(cls, equipment: models.Equipment):
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

