from __future__ import annotations
from datetime import datetime
from http import HTTPStatus

from typing import TYPE_CHECKING, Optional, cast
from typing_extensions import override
from uuid import UUID, uuid4
from fastapi import HTTPException

from sqlalchemy import not_, select

from db import LocalSession, local_object_session
from db.models.lab.lab import Lab
from db.models.lab.lab_equipment import (
    LabEquipmentInstallation,
    LabEquipmentInstallationItem,
    LabEquipmentProvision,
    ProvisionStatus,
    create_known_install,
    create_new_provision,
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
from db.models.research.funding import ResearchFunding


class LabEquipmentView(ModelView[LabEquipment]):
    id: UUID
    name: str
    description: str

    training_descriptions: list[str]
    tags: set[str]

    installations: ModelIndexPage[LabEquipmentInstallationView]
    active_provisions: ModelIndexPage[LabEquipmentProvisionView]

    @classmethod
    async def from_model(cls, equipment: LabEquipment):
        db = local_object_session(equipment)
        installation_index = LabEquipmentInstallationIndex(
            select(LabEquipmentInstallation).where(
                LabEquipmentInstallation.equipment_id == equipment.id,
                LabEquipmentInstallation.provision_status == ProvisionStatus.INSTALLED,
            )
        )
        installations = await installation_index.load_page(db, 1)

        active_provision_index = LabEquipmentProvisionIndex(
            select(LabEquipmentProvision).where(
                LabEquipmentProvision.equipment_id == equipment.id,
                not_(
                    LabEquipmentProvision.status.in_(
                        [ProvisionStatus.CANCELLED, ProvisionStatus.INSTALLED]
                    )
                ),
            )
        )
        active_provisions = await active_provision_index.load_page(db, 1)

        return cls(
            id=cast(UUID, equipment.id),
            name=equipment.name,
            description=equipment.description,
            training_descriptions=list(equipment.training_descriptions),
            tags=set(equipment.tags),
            installations=installations,
            active_provisions=active_provisions,
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


class LabEquipmentUpdateRequest(ModelUpdateRequest[LabEquipment]):
    description: str | None = None
    tags: list[str] | None = None
    training_descriptions: list[str] | None = None

    async def do_update(self, model: LabEquipment):
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


class LabEquipmentInstallationView(ModelView[LabEquipmentInstallation]):
    equipment: UUID
    equipment_name: str
    lab: UUID
    num_installed: int
    provision_status: ProvisionStatus

    items: list[LabEquipmentInstallationItemView]

    @classmethod
    async def from_model(
        cls,
        model: LabEquipmentInstallation,
        *,
        equipment: LabEquipment | None = None,
    ):
        if equipment is not None:
            equipment_ = equipment
        else:
            equipment_ = await model.awaitable_attrs.equipment

        items = [
            await LabEquipmentInstallationItemView.from_model(m)
            for m in await model.awaitable_attrs.installed_items
        ]

        return cls(
            id=model.id,
            equipment=equipment_.id,
            equipment_name=equipment_.name,
            lab=model.lab_id,
            provision_status=model.provision_status,
            num_installed=model.num_installed,
            items=items,
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
        raise NotImplementedError


class LabEquipmentInstallationItemView(ModelView[LabEquipmentInstallationItem]):
    id: UUID
    installation_id: UUID
    installation_index: int
    provision_status: ProvisionStatus
    last_provisioned_at: datetime | None
    name: str

    @classmethod
    async def from_model(
        cls, model: LabEquipmentInstallationItem
    ) -> LabEquipmentInstallationItemView:
        return cls(
            id=model.id,
            installation_id=model.installation_id,
            installation_index=model.installation_index,
            name=model.name,
            provision_status=model.provision_status,
            last_provisioned_at=model.last_provisioned_at,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class LabEquipmentProvisionView(ModelView[LabEquipmentProvision]):
    lab: UUID | None
    equipment: UUID
    installation: LabEquipmentInstallationView | None

    status: ProvisionStatus
    reason: str
    quantity_required: int

    funding: UUID | None
    estimated_cost: float | None

    @classmethod
    async def from_model(
        cls,
        model: LabEquipmentProvision,
        *,
        installation: LabEquipmentInstallation | None = None,
        equipment: LabEquipment | None = None,
    ):
        if not installation and model.installation_id:
            installation = await model.awaitable_attrs.installation

        if installation:
            installation_view = await LabEquipmentInstallationView.from_model(
                installation, equipment=equipment
            )
        else:
            installation_view = None

        print("equipment_id", model.equipment_id)
        print("updated_at", model.updated_at)
        print("created_at", model.created_at)

        return cls(
            id=model.id,
            status=model.status,
            reason=model.reason,
            equipment=model.equipment_id,
            lab=model.lab_id,
            installation=installation_view,
            funding=model.funding_id,
            estimated_cost=model.estimated_cost,
            quantity_required=model.quantity_required,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class LabEquipmentProvisionIndex(ModelIndex[LabEquipmentProvisionView]):
    __item_view__ = LabEquipmentProvisionView


# TODO: mypy does not support PEP 695
type LabEquipmentProvisionPage = ModelIndexPage[LabEquipmentProvisionView]  # type: ignore


class CreateEquipmentProvisionRequest(ModelCreateRequest[LabEquipment]):
    status: ProvisionStatus

    quantity_required: int

    reason: str

    lab: Lab | UUID | None

    funding: ResearchFunding | UUID | None
    estimated_cost: float | None

    purchase_url: str

    async def get_lab(self, db: LocalSession) -> Lab | None:
        if isinstance(self.lab, UUID):
            self.lab = await Lab.get_for_id(db, self.lab)
        return cast(Lab | None, self.lab)

    async def get_funding(self, db: LocalSession) -> ResearchFunding | None:
        if isinstance(self.funding, UUID):
            self.funding = await ResearchFunding.get_for_id(db, self.funding)
        return cast(ResearchFunding | None, self.funding)

    async def do_create(self, db: LocalSession, equipment: LabEquipment | None = None):
        if equipment is None:
            raise ValueError("Equipment must be supplied from context")
        lab = (await self.get_lab(db)) if self.lab else None

        if self.status == ProvisionStatus.REQUESTED:
            return await create_new_provision(
                db,
                equipment,
                quantity_required=self.quantity_required,
                lab=(await self.get_lab(db)) if self.lab else None,
                funding=(await self.get_funding(db)) if self.funding else None,
                estimated_cost=self.estimated_cost,
                reason=self.reason,
                purchase_url=self.purchase_url,
            )
        elif self.status == ProvisionStatus.INSTALLED:
            if lab is None:
                raise HTTPException(
                    HTTPStatus.BAD_REQUEST,
                    detail="lab must be provided if importing a known install",
                )

            return await create_known_install(
                db, equipment, lab, num_installed=self.quantity_required
            )
        else:
            raise HTTPException(
                HTTPStatus.BAD_REQUEST, detail="status must be installed or requested"
            )


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

    async def get_lab(self, db: LocalSession) -> Lab | None:
        if isinstance(self.lab, UUID):
            self.lab = await Lab.get_for_id(db, self.lab)
        return cast(Lab | None, self.lab)

    async def get_or_create_equipment(self, db: LocalSession) -> LabEquipment:
        if isinstance(self.equipment, LabEquipment):
            pass
        elif isinstance(self.equipment, UUID):
            self.equipment = await LabEquipment.get_for_id(db, self.equipment)
        elif isinstance(self.equipment, LabEquipmentCreateRequest):
            self.equipment = await self.equipment.do_create(db)
        return cast(LabEquipment, self.equipment)

    async def maybe_create_installation(
        self, db: LocalSession
    ) -> LabEquipmentInstallation | None:
        lab = await self.get_lab(db)
        if lab is None:
            return None
        equipment = await self.get_or_create_equipment(db)
        print(f"creating installation in {lab.id}")
        installation = LabEquipmentInstallation(
            equipment=equipment,
            lab=lab,
            num_installed=self.quantity_required,
            provision_status=ProvisionStatus.REQUESTED,
        )
        db.add(installation)
        await db.commit()
        return installation

    async def do_create(self, db: LocalSession):
        equipment = await self.get_or_create_equipment(db)
        installation = await self.maybe_create_installation(db)
        provision = LabEquipmentProvision(
            equipment_or_install=installation if installation else equipment,
            estimated_cost=self.estimated_cost,
            quantity_required=self.quantity_required,
            purchase_url=self.purchase_url,
        )
        db.add(provision)
        await db.commit()
        return provision
