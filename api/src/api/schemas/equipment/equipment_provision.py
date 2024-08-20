from http import HTTPStatus
from typing import Coroutine, Generic, TypeVar, cast
from uuid import UUID

from fastapi import Depends, HTTPException

from api.schemas.equipment.equipment import EquipmentCreateRequest
from api.schemas.lab.lab_installation import LabInstallationProvisionDetail
from db import LocalSession
from db.models.equipment.equipment_provision import (
    DeclareEquipmentProvision,
    NewEquipmentProvision,
    UpgradeEquipmentProvision,
)
from db.models.lab import Lab
from db.models.lab.provisionable import ProvisionStatus
from db.models.research import ResearchFunding
from db.models.equipment import (
    Equipment,
    EquipmentInstallation,
    EquipmentInstallationProvision,
)
from db.models.user import User

from ..base import (
    ModelDetail,
    ModelIndex,
    ModelCreateRequest,
    ModelIndexPage,
    ModelRequest,
    ModelUpdateRequest,
)
from ..lab.lab_provision import (
    LabProvisionCreateRequest,
    LabProvisionDetail,
    LabProvisionRejection,
)
from .equipment_installation import EquipmentInstallationDetail


class EquipmentProvisionDetail(
    LabInstallationProvisionDetail[EquipmentInstallationProvision]
):
    equipment_id: UUID
    installation_id: UUID

    quantity_required: float

    @classmethod
    async def from_model(
        cls,
        model: EquipmentInstallationProvision,
    ):
        return await cls._from_lab_installation_provision(
            model,
            equipment_id=model.equipment_id,
            installation_id=model.installation_id,
            quantity_required=model.quantity_required,
        )


class EquipmentProvisionIndex(ModelIndex[EquipmentInstallationProvision]):
    async def item_from_model(
        self, model: EquipmentInstallationProvision
    ) -> ModelDetail[EquipmentInstallationProvision]:
        return await EquipmentProvisionDetail.from_model(model)


EquipmentProvisionPage = ModelIndexPage[EquipmentInstallationProvision]


class EquipmentProvisionCreateRequest(
    LabProvisionCreateRequest[EquipmentInstallationProvision]
):
    installation: UUID
    quantity_required: int
    purchase_url: str

    async def get_installation(self, db: LocalSession):
        return await EquipmentInstallation.get_by_id(db, self.installation)

    async def do_create_lab_provision(
        self,
        db: LocalSession,
        type: str,
        *,
        lab: Lab,
        funding: ResearchFunding | None,
        current_user: User,
        note: str,
    ) -> EquipmentInstallationProvision:
        installation = await self.get_installation(db)
        match self.type:
            case "new_equipment":
                return NewEquipmentProvision(
                    installation,
                    note=self.note,
                    requested_by=current_user,
                )
            case "upgrade_equipment":
                return UpgradeEquipmentProvision(
                    installation, note=self.note, requested_by=current_user
                )
            case "declare_equipment":
                return DeclareEquipmentProvision(
                    installation, note=self.note, requested_by=current_user
                )
            case _:
                raise TypeError("Unknown equipment provision type")


class EquipmentProvisionRequest:
    async def resolve_model(self, db: LocalSession, id: UUID):
        return await EquipmentInstallationProvision.get_by_id(db, id)


class EquipmentProvisionRejection(
    LabProvisionRejection[EquipmentInstallationProvision], EquipmentProvisionRequest
):
    pass


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
        assert installation is not None
        provision = EquipmentInstallationProvision(
            installation,
            estimated_cost=self.estimated_cost,
            quantity_required=self.quantity_required,
            purchase_url=self.purchase_url,
        )
        db.add(provision)
        await db.commit()
        return provision
