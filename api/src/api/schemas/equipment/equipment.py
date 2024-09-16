from __future__ import annotations
import asyncio
from datetime import datetime
from http import HTTPStatus

from typing import TYPE_CHECKING, Optional, cast
from pydantic import Field
from uuid import UUID, uuid4
from fastapi import HTTPException

from sqlalchemy import not_, select

from db import LocalSession, local_object_session
from db.models.base.base import model_id
from db.models.equipment.equipment import query_equipments
from db.models.lab import Lab
from db.models.lab.provisionable import ProvisionStatus
from db.models.equipment import (
    Equipment,
    EquipmentInstallation,
    EquipmentInstallationProvision,
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
    ModelIndex,
)

if TYPE_CHECKING:
    from .equipment_installation import DeclareEquipmentInstallationRequest, EquipmentInstallationIndexPage


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
        from .equipment_installation import EquipmentInstallationIndex
        db = local_object_session(model)

        installation_index = EquipmentInstallationIndex(
            equipment=model_id(model)
        )

        return cls(
            id=cast(UUID, model.id),
            name=model.name,
            description=model.description,
            training_descriptions=list(model.training_descriptions),
            tags=set(model.tags),
            installations=await installation_index.load_page(db),
            disciplines=model.disciplines,

            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class EquipmentIndex(ModelIndex[Equipment]):
    search: str | None = None

    lab_id: UUID | None
    name_istartswith: str | None = None
    name_eq: str | None = None
    has_tags: set[str] = Field(default_factory=set)

    installed_campus: list[UUID] | None = None
    discipline: list[Discipline] | None = None

    async def item_from_model(self, model: Equipment):
        return await EquipmentDetail.from_model(model)

    def get_selection(self):
        return query_equipments(
            search=self.search,
            lab=self.lab_id,
            name_istartswith=self.name_istartswith,
            name_eq=self.name_eq,
            has_tags=self.has_tags,
            installed_campus=cast(list[Campus | UUID] | None, self.installed_campus),
            installed_discipline=self.discipline
        )


EquipmentIndexPage = ModelIndexPage[Equipment, EquipmentDetail]


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

    installations: list[DeclareEquipmentInstallationRequest] = Field(default_factory=list)

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
