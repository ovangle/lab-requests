from __future__ import annotations

from typing import TYPE_CHECKING, cast
from typing_extensions import override
from uuid import UUID, uuid4

from sqlalchemy import select
from api.lab.schemas import LabView

from db import LocalSession, local_object_session
from db.models.lab.lab import Lab
from db.models.lab.lab_equipment import (
    LabEquipmentInstallation,
    LabEquipmentProvision,
    LabEquipmentProvisioningStatus,
)
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

    installations: dict[UUID, int]

    @classmethod
    async def from_model(cls, equipment: LabEquipment):
        db = local_object_session(equipment)
        installed_in_lab_ids = await db.execute(
            select(
                LabEquipmentInstallation.id, LabEquipmentInstallation.num_installed
            ).where(LabEquipmentInstallation.equipment_id == equipment.id)
        )
        installations = dict((k, v) for k, v in installed_in_lab_ids)

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
    """
    Represents an instruction to create a specific type of equipment.
    """

    name: str
    description: str | None = None
    tags: list[str] | None = None
    training_descriptions: list[str] | None = None

    async def do_create(self, db: LocalSession):
        equipment = LabEquipment(
            id=uuid4(),
            name=self.name,
            description=self.description or "",
            tags=self.tags or list(),
            training_descriptions=self.training_descriptions or list(),
        )
        db.add(equipment)
        return equipment


class LabEquipmentInstallRequest(ModelCreateRequest[LabEquipment]):
    """
    Represents a request to install an equipment into a specific
    lab.
    """

    equipment: LabEquipment | UUID | LabEquipmentCreateRequest
    lab: Lab | UUID

    async def do_create(self, db: LocalSession):
        equipment: LabEquipment
        if isinstance(self.equipment, LabEquipment):
            equipment = self.equipment
        elif isinstance(self.equipment, UUID):
            equipment = await LabEquipment.get_for_id(db, self.equipment)
        else:
            equipment = await self.equipment.do_create(db)

        lab: Lab
        if isinstance(self.lab, Lab):
            lab = self.lab
        else:
            lab = await Lab.get_for_id(db, self.lab)

        install = LabEquipmentInstallation(
            equipment_id=equipment.id,
            lab_id=lab.id,
        )
        db.add(install)
        await db.commit()


class LabEquipmentProvisionView(ModelView[LabEquipmentProvision]):
    equipment: LabEquipmentView
    lab: LabView | None

    status: LabEquipmentProvisioningStatus

    estimated_cost: float | None
    quantity_required: int

    @classmethod
    async def from_model(cls, model: LabEquipmentProvision):
        equipment = await LabEquipmentView.from_model(
            await model.awaitable_attrs.equipment
        )
        lab = (await model.awaitable_attrs.lab) if model.lab_id else None

        return cls(
            id=model.id,
            status=model.status,
            equipment=equipment,
            lab=lab,
            estimated_cost=model.estimated_cost,
            quantity_required=model.quantity_required,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class LabEquipmentProvisioningIndex(
    ModelIndex[LabEquipmentProvisionView, LabEquipmentProvision]
):
    __item_view__ = LabEquipmentProvisionView


LabEquipmentProvisioningPage = ModelIndexPage[
    LabEquipmentProvisionView, LabEquipmentProvision
]


class LabEquipmentProvisionRequest(ModelCreateRequest[LabEquipment]):
    """
    Represents a request to provision a lab with a specific piece of
    equipment
    """

    equipment: LabEquipment | UUID | LabEquipmentCreateRequest
    lab: Lab | UUID | None = None

    estimated_cost: float | None = None
    quantity_required: int = 1
    purchase_url: str = "<<unknown>>"

    async def do_create(self, db: LocalSession):
        equipment: LabEquipment
        if isinstance(self.equipment, LabEquipment):
            equipment = self.equipment
        elif isinstance(self.equipment, UUID):
            equipment = await LabEquipment.get_for_id(db, self.equipment)
        else:
            equipment = await self.equipment.do_create(db)
        self.equipment = equipment

        if isinstance(self.lab, Lab):
            lab = self.lab
        elif isinstance(self.lab, UUID):
            lab = await Lab.get_for_id(db, self.lab)
        else:
            raise ValueError("Expected a lab")
        self.lab = lab

        provision = LabEquipmentProvision(
            equipment_or_install=equipment,
            lab=lab,
            estimated_cost=self.estimated_cost,
            quantity_required=self.quantity_required,
            purchase_url=self.purchase_url,
        )
        db.add(provision)
        await db.commit()
        return provision


class LabEquipmentUpdateRequest(ModelUpdateRequest[LabEquipment]):
    async def do_update(self, model: LabEquipment):
        raise NotImplementedError
