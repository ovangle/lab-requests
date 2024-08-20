from __future__ import annotations
import asyncio
from datetime import datetime
from http import HTTPStatus

from typing import TYPE_CHECKING, Optional, cast
from pydantic import Field
from typing_extensions import override
from uuid import UUID, uuid4
from fastapi import HTTPException

from sqlalchemy import not_, select

from db import LocalSession, local_object_session
from db.models.equipment.equipment import query_equipments
from db.models.lab import Lab
from db.models.lab.provisionable import ProvisionStatus
from db.models.equipment import (
    Equipment,
    EquipmentInstallation,
    EquipmentInstallationProvision,
)
from db.models.user import User

from ..base import (
    ModelCreateRequest,
    ModelIndexPage,
    ModelRequest,
    ModelRequestContextError,
    ModelUpdateRequest,
    ModelDetail,
    ModelLookup,
    ModelIndex,
)
from db.models.research.funding import ResearchFunding

if TYPE_CHECKING:
    from .equipment_installation import EquipmentInstallationDetail


class EquipmentDetail(ModelDetail[Equipment]):
    id: UUID
    name: str
    description: str

    training_descriptions: list[str]
    tags: set[str]

    installations: list[EquipmentInstallationDetail]

    @classmethod
    async def from_model(cls, model: Equipment):
        from .equipment_installation import EquipmentInstallationDetail

        installation_models = await model.awaitable_attrs.installations
        installations = await asyncio.gather(
            *(EquipmentInstallationDetail.from_model(m) for m in installation_models)
        )

        return cls(
            id=cast(UUID, model.id),
            name=model.name,
            description=model.description,
            training_descriptions=list(model.training_descriptions),
            tags=set(model.tags),
            installations=installations,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class EquipmentIndex(ModelIndex[Equipment]):

    lab_id: UUID | None
    name_istartswith: str | None = None
    name_eq: str | None = None
    has_tags: set[str] = Field(default_factory=set)

    async def item_from_model(self, model: Equipment):
        return await EquipmentDetail.from_model(model)

    def get_selection(self):
        return query_equipments(
            lab=self.lab_id,
            name_istartswith=self.name_istartswith,
            name_eq=self.name_eq,
            has_tags=self.has_tags,
        )


EquipmentIndexPage = ModelIndexPage[Equipment]


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

    async def do_create(
        self, db: LocalSession, current_user: User | None = None, **kwargs
    ):
        if not current_user:
            raise ModelRequestContextError("No current user")
        equipment = Equipment(
            id=uuid4(),
            name=self.name,
            description=self.description or "",
            tags=self.tags or list(),
            training_descriptions=self.training_descriptions or list(),
        )
        return await equipment.save()


class EquipmentUpdateRequest(ModelUpdateRequest[Equipment]):
    description: str | None = None
    tags: list[str] | None = None
    training_descriptions: list[str] | None = None

    async def apply(self, equipment: Equipment):
        if self.description:
            equipment.description = self.description
        if self.tags:
            equipment.tags = self.tags
        if self.training_descriptions:
            equipment.training_descriptions = self.training_descriptions
        return await equipment.save()
