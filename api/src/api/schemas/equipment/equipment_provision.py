from http import HTTPStatus
from typing import cast
from uuid import UUID

from fastapi import HTTPException

from api.schemas.equipment.equipment import EquipmentCreateRequest
from db import LocalSession
from db.models.lab import Lab, ProvisionStatus
from db.models.research import ResearchFunding
from db.models.equipment import Equipment, EquipmentInstallation, EquipmentProvision

from ..base import ModelView, ModelIndex, ModelCreateRequest, ModelUpdateRequest
from .equipment_installation import EquipmentInstallationView


class EquipmentProvisionView(ModelView[EquipmentProvision]):
    lab: UUID | None
    equipment: UUID
    installation: EquipmentInstallationView | None

    status: ProvisionStatus
    reason: str
    quantity_required: int

    funding: UUID | None
    estimated_cost: float | None

    @classmethod
    async def from_model(
        cls,
        model: EquipmentProvision,
        *,
        installation: EquipmentInstallation | None = None,
        equipment: Equipment | None = None,
    ):
        if not installation and model.installation_id:
            installation = await model.awaitable_attrs.installation

        if installation:
            installation_view = await EquipmentInstallationView.from_model(
                installation, equipment=equipment
            )
        else:
            installation_view = None

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


class EquipmentProvisionIndex(ModelIndex[EquipmentProvisionView]):
    __item_view__ = EquipmentProvisionView


# TODO: mypy does not support PEP 695
type EquipmentProvisionPage = ModelIndexPage[EquipmentProvisionView]  # type: ignore


class EquipmentProvisionRequest(ModelCreateRequest[Equipment]):
    status: ProvisionStatus

    quantity_required: int

    reason: str

    lab: Lab | UUID

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

    async def do_create(
        self, db: LocalSession, *, equipment: Equipment | None = None, **kwargs
    ):
        assert not kwargs
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
        elif self.status == ProvisionStatus.COMPLETED:
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


class LabEquipmentProvisionRequest(ModelCreateRequest[Equipment]):
    """
    Represents a request to provision a lab with a specific piece of
    equipment
    """

    equipment: Equipment | UUID | EquipmentCreateRequest
    lab: Lab | UUID | None = None

    estimated_cost: float | None = None
    quantity_required: int = 1
    purchase_url: str = "<<unknown>>"

    async def get_lab(self, db: LocalSession) -> Lab | None:
        if isinstance(self.lab, UUID):
            self.lab = await Lab.get_for_id(db, self.lab)
        return cast(Lab | None, self.lab)

    async def get_or_create_equipment(self, db: LocalSession) -> Equipment:
        if isinstance(self.equipment, Equipment):
            pass
        elif isinstance(self.equipment, UUID):
            self.equipment = await Equipment.get_for_id(db, self.equipment)
        elif isinstance(self.equipment, EquipmentCreateRequest):
            self.equipment = await self.equipment.do_create(db)
        return cast(Equipment, self.equipment)

    async def maybe_create_installation(
        self, db: LocalSession
    ) -> EquipmentInstallation | None:
        lab = await self.get_lab(db)
        if lab is None:
            return None
        equipment = await self.get_or_create_equipment(db)
        print(f"creating installation in {lab.id}")
        installation = EquipmentInstallation(
            equipment=equipment,
            lab=lab,
            num_installed=self.quantity_required,
            provision_status=ProvisionStatus.REQUESTED,
        )
        db.add(installation)
        await db.commit()
        return installation

    async def do_create(self, db: LocalSession, **kwargs):
        assert not kwargs
        equipment = await self.get_or_create_equipment(db)
        installation = await self.maybe_create_installation(db)
        provision = EquipmentProvision(
            equipment_or_install=installation if installation else equipment,
            estimated_cost=self.estimated_cost,
            quantity_required=self.quantity_required,
            purchase_url=self.purchase_url,
        )
        db.add(provision)
        await db.commit()
        return provision
