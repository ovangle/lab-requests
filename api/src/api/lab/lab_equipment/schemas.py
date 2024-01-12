from __future__ import annotations


from typing import TYPE_CHECKING, cast
from typing_extensions import override
from uuid import UUID
from fastapi import HTTPException

from pydantic import BaseModel
from sqlalchemy import Select

from db import LocalSession
from db.models.lab.lab_equipment import LabEquipmentProvision
from db.models.uni import Discipline
from db.models.lab import LabEquipment
from api.base.schemas import (
    ModelIndexPage,
    ModelUpdateRequest,
    ModelView,
    ModelLookup,
    ModelCreateRequest,
    ModelIndex,
)


class LabEquipmentView(ModelView[LabEquipment]):
    id: UUID
    name: str
    description: str

    training_descriptions: list[str]
    tags: set[str]

    @classmethod
    async def from_model(cls, equipment: LabEquipment):
        return cls(
            id=cast(UUID, equipment.id),
            name=equipment.name,
            description=equipment.description,
            training_descriptions=list(equipment.training_descriptions),
            tags=set(equipment.tags),
            created_at=equipment.created_at,
            updated_at=equipment.updated_at,
        )


class LabEquipmentIndex(ModelIndex[LabEquipmentView, LabEquipment]):
    __item_view__ = LabEquipmentView


# TODO: type PEP 695
LabEquipmentIndexPage = ModelIndexPage[LabEquipmentView, LabEquipment]


class LabEquipmentLookup(ModelLookup[LabEquipment]):
    id: UUID | None = None

    async def get(self, db: LocalSession):
        if self.id:
            return await LabEquipment.get_for_id(db, self.id)
        else:
            raise ValueError("ID must be provided")


async def lookup_equipment(db: LocalSession, equipment: UUID | LabEquipmentLookup):
    if isinstance(equipment, UUID):
        equipment = LabEquipmentLookup(id=equipment)
    return await equipment.get(db)


class LabEquipmentCreateRequest(ModelCreateRequest[LabEquipment]):
    async def do_create(self, db: LocalSession):
        raise NotImplementedError


class LabEquipmentUpdateRequest(ModelUpdateRequest[LabEquipment]):
    async def do_update(self, model: LabEquipment):
        raise NotImplementedError


class LabEquipmentProvisionView(ModelView[LabEquipmentProvision]):
    @classmethod
    async def from_model(cls, model: LabEquipmentProvision):
        raise NotImplementedError()
