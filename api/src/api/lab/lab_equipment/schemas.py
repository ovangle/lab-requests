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
    ProvisionStatus,
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

    installations: ModelIndexPage[LabEquipmentInstallationView]

    @classmethod
    async def from_model(cls, equipment: LabEquipment):
        db = local_object_session(equipment)
        installation_index = LabEquipmentInstallationIndex(
            select(LabEquipmentInstallation).where(
                LabEquipmentInstallation.equipment_id == equipment.id,
                LabEquipmentInstallation.provision_status != ProvisionStatus.CANCELLED,
            )
        )
        installations = await installation_index.load_page(db, 0)

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


class LabEquipmentIndex(ModelIndex[LabEquipmentView]):
    __item_view__ = LabEquipmentView


# TODO: type PEP 695
type LabEquipmentIndexPage = ModelIndexPage[LabEquipmentView]  # type: ignore


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


class LabEquipmentInstallationView(ModelView[LabEquipmentInstallation]):
    equipment_id: UUID
    lab_id: UUID
    num_installed: int
    provision_status: ProvisionStatus

    @classmethod
    async def from_model(cls, model: LabEquipmentInstallation):
        return cls(
            id=model.id,
            equipment_id=model.equipment_id,
            lab_id=model.lab_id,
            provision_status=model.provision_status,
            num_installed=model.num_installed,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class LabEquipmentInstallationIndex(ModelIndex[LabEquipmentInstallationView]):
    __item_view__ = LabEquipmentInstallationView


# FIXME: mypy does not support PEP 695
type LabEquipmentInstallationPage = ModelIndexPage[LabEquipmentInstallationView]  # type: ignore


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
    equipment_id: UUID
    installation: LabEquipmentInstallationView | None

    status: ProvisionStatus

    estimated_cost: float | None
    quantity_required: int

    @classmethod
    async def from_model(cls, model: LabEquipmentProvision):
        if model.installation_id:
            installation_model = await model.awaitable_attrs.installation
            installation = await LabEquipmentInstallationView.from_model(
                installation_model
            )
        else:
            installation = None

        return cls(
            id=model.id,
            status=model.status,
            equipment_id=model.equipment_id,
            installation=installation,
            estimated_cost=model.estimated_cost,
            quantity_required=model.quantity_required,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class LabEquipmentProvisionIndex(ModelIndex[LabEquipmentProvisionView]):
    __item_view__ = LabEquipmentProvisionView


# TODO: mypy does not support PEP 695
type LabEquipmentProvisionPage = ModelIndexPage[LabEquipmentProvisionView]  # type: ignore


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
