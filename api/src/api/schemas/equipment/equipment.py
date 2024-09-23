from __future__ import annotations
import asyncio
from datetime import datetime
from http import HTTPStatus

from typing import TYPE_CHECKING, Optional, cast, override
from pydantic import Field
from uuid import UUID, uuid4
from fastapi import HTTPException

from sqlalchemy import not_, select

from db import LocalSession, local_object_session
from db.models.base.base import model_id
from db.models.equipment.equipment import query_equipments
from db.models.equipment.equipment_installation import query_equipment_installations
from db.models.lab import Lab
from db.models.lab.provisionable import ProvisionStatus
from db.models.equipment import (
    Equipment,
)
from db.models.uni.campus import Campus
from db.models.uni.discipline import Discipline
from db.models.user import User

from ..base import (
    ModelCreateRequest,
    ModelIndexPage,
    ModelRequest,
    ModelRequestContextError,
    ModelUpdateRequest,
    ModelDetail,
    ModelLookup,
)

if TYPE_CHECKING:
    from .equipment_installation import CreateEquipmentInstallationRequest, EquipmentInstallationIndexPage


class EquipmentDetail(ModelDetail[Equipment]):
    id: UUID
    name: str
    description: str

    training_descriptions: list[str]
    tags: set[str]

    disciplines: list[Discipline]

    installations: EquipmentInstallationIndexPage


    @classmethod
    async def from_model(cls, model: Equipment):
        from .equipment_installation import EquipmentInstallationIndexPage, EquipmentInstallationDetail
        db = local_object_session(model)

        installations = await EquipmentInstallationIndexPage.from_selection(
            db,
            query_equipment_installations(equipment=model),
        )

        return cls(
            id=cast(UUID, model.id),
            name=model.name,
            description=model.description,
            training_descriptions=list(model.training_descriptions),
            tags=set(model.tags),
            installations=installations,
            disciplines=model.disciplines,

            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class EquipmentIndexPage(ModelIndexPage[Equipment, EquipmentDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: Equipment):
        return await EquipmentDetail.from_model(item)


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

    installations: list[CreateEquipmentInstallationRequest] = Field(default_factory=list)

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
        db.add(equipment)
        await db.commit()

        for installation in self.installations:
            await installation.do_create(
                db,
                current_user=current_user,
                equipment=equipment
            )

        return equipment


class EquipmentUpdateRequest(ModelUpdateRequest[Equipment]):
    description: str | None = None
    tags: list[str] | None = None
    training_descriptions: list[str] | None = None

    async def do_update(self, equipment: Equipment, current_user: User | None= None):
        if not current_user:
            raise ModelRequestContextError('no current authenticated user')
        db = local_object_session(equipment)

        if self.description:
            equipment.description = self.description
        if self.tags:
            equipment.tags = self.tags
        if self.training_descriptions:
            equipment.training_descriptions = self.training_descriptions
        db.add(equipment)
        await db.commit()
        return equipment
