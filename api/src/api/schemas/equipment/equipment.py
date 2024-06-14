from __future__ import annotations
from datetime import datetime
from http import HTTPStatus

from typing import TYPE_CHECKING, Optional, cast
from typing_extensions import override
from uuid import UUID, uuid4
from fastapi import HTTPException

from sqlalchemy import not_, select

from db import LocalSession, local_object_session
from db.models.lab import Lab
from db.models.lab.provisionable import ProvisionStatus
from db.models.equipment import Equipment, EquipmentInstallation, EquipmentProvision

from ..base import (
    ModelIndexPage,
    ModelUpdateRequest,
    ModelView,
    ModelLookup,
    ModelCreateRequest,
    ModelIndex,
)
from db.models.research.funding import ResearchFunding

if TYPE_CHECKING:
    from .equipment_installation import EquipmentInstallationView


class EquipmentView(ModelView[Equipment]):
    id: UUID
    name: str
    description: str

    training_descriptions: list[str]
    tags: set[str]

    installations: ModelIndexPage[EquipmentInstallationView]

    @classmethod
    async def from_model(cls, equipment: Equipment):
        from .equipment_installation import EquipmentInstallationIndex

        db = local_object_session(equipment)
        installation_index = EquipmentInstallationIndex(
            select(EquipmentInstallation).where(
                EquipmentInstallation.equipment_id == equipment.id
            )
        )
        installations = await installation_index.load_page(db, 1)

        return cls(
            id=cast(UUID, equipment.id),
            name=equipment.name,
            description=equipment.description,
            training_descriptions=list(equipment.training_descriptions),
            tags=set(equipment.tags),
            installations=installations,
            created_at=equipment.created_at,
            updated_at=equipment.updated_at,
        )


class EquipmentIndex(ModelIndex[EquipmentView]):
    __item_view__ = EquipmentView


# TODO: type PEP 695
type EquipmentIndexPage = ModelIndexPage[EquipmentView]  # type: ignore


class EquipmentLookup(ModelLookup[Equipment]):
    id: UUID | None = None

    async def get(self, db: LocalSession):
        if self.id:
            return await Equipment.get_for_id(db, self.id)
        else:
            raise ValueError("ID must be provided")


async def lookup_equipment(db: LocalSession, equipment: UUID | EquipmentLookup):
    if isinstance(equipment, UUID):
        equipment = EquipmentLookup(id=equipment)
    return await equipment.get(db)


class EquipmentCreateRequest(ModelCreateRequest[Equipment]):
    """
    Represents an instruction to create a specific type of equipment.
    """

    name: str
    description: str | None = None
    tags: list[str] | None = None
    training_descriptions: list[str] | None = None

    async def do_create(self, db: LocalSession, **kwargs):
        assert not kwargs
        equipment = Equipment(
            id=uuid4(),
            name=self.name,
            description=self.description or "",
            tags=self.tags or list(),
            training_descriptions=self.training_descriptions or list(),
        )
        db.add(equipment)
        await db.commit()
        return equipment


class EquipmentUpdateRequest(ModelUpdateRequest[Equipment]):
    description: str | None = None
    tags: list[str] | None = None
    training_descriptions: list[str] | None = None

    async def do_update(self, model: Equipment, **kwargs):
        assert not kwargs
        db = local_object_session(model)
        if self.description:
            model.description = self.description
        if self.tags:
            model.tags = self.tags
        if self.training_descriptions:
            model.training_descriptions = self.training_descriptions
        db.add(model)
        await db.commit()
        return await db.refresh(model)
