from __future__ import annotations

from typing import TYPE_CHECKING, Any
from uuid import UUID

from api.schemas.base import ModelDetail
from api.schemas.equipment.equipment import EquipmentCreateRequest, EquipmentDetail
from api.schemas.lab.lab_provision import LabProvisionApproval, LabProvisionCancel, LabProvisionComplete, LabProvisionDenial, LabProvisionPurchase, LabProvisionRejection
from db import LocalSession
from db.models.equipment import (
    EquipmentInstallation,
    EquipmentInstallationProvision,
    query_equipment_installations,
)
from db.models.equipment.equipment import Equipment
from db.models.equipment.equipment_installation import query_equipment_installation_provisions
from db.models.lab import Lab
from db.models.lab.installable.lab_installation import LabInstallation
from db.models.research.funding import ResearchFunding
from db.models.user import User

from ..base import (
    ModelCreateRequest,
    ModelIndex,
    ModelIndexPage,
    ModelRequestContextError,
)
from ..lab.lab_installation import LabInstallationDetail, LabInstallationProvisionCreateRequest, LabInstallationProvisionDetail, LabInstallationProvisionIndex

if TYPE_CHECKING:
    from .equipment_lease import EquipmentLeaseIndex, EquipmentLeaseDetail


class EquipmentInstallationProvisionDetail(LabInstallationProvisionDetail[EquipmentInstallationProvision]):
    @classmethod
    async def from_model(cls, model: EquipmentInstallationProvision):
        return await cls._from_lab_installation_provision(model)


class EquipmentInstallationProvisionIndex(LabInstallationProvisionIndex[EquipmentInstallationProvision]):
    async def item_from_model(self, item):
        return await EquipmentInstallationProvisionDetail.from_model(item)

    def get_selection(self):
        return query_equipment_installation_provisions(
            installation=self.installation,
            only_pending=self.only_pending
        )


class EquipmentInstallationProvisionCreateRequest(LabInstallationProvisionCreateRequest[EquipmentInstallationProvision]):
    async def get_installation(self, db: LocalSession):
        return await EquipmentInstallation.get_by_id(db, self.installation_id)


class DeclareEquipmentInstallationRequest(ModelCreateRequest[EquipmentInstallation]):
    """
    Declares an already existing equipment installation
    """

    equipment: EquipmentCreateRequest | UUID | None = None
    lab: Lab | UUID

    model_name: str | None = None
    num_installed: int

    async def do_create(self, db: LocalSession, current_user: User | None = None, equipment: Equipment | UUID | None = None):
        if not current_user:
            raise ModelRequestContextError('No current user')

        if isinstance(self.equipment, EquipmentCreateRequest):
            equipment = await self.equipment.do_create(db, current_user=current_user)
        elif isinstance(self.equipment, UUID):
            equipment = self.equipment
        elif equipment is None:
            raise ModelRequestContextError("No equipment in context")

        installation = EquipmentInstallation(
            self.lab,
            equipment,
            model_name=self.model_name or '',
            num_installed=self.num_installed,
            created_by=current_user
        )
        db.add(installation)
        await db.commit()
        return installation

EquipmentCreateRequest.model_rebuild()

class NewEquipmentRequest(EquipmentInstallationProvisionCreateRequest):
    """
    Creates a provision, which, when completed will result in a new installation
    of the specified equipment.
    """

    num_required: int

    async def do_create_lab_provision(self, db: LocalSession, type: str, *, lab: Lab, funding: ResearchFunding | None, current_user: User, note: str) -> EquipmentInstallationProvision:
        installation = await self.get_installation(db)

        return await EquipmentInstallationProvision.new_equipment(
            db,
            installation,
            quantity_required=self.num_required,
            requested_by=current_user,
            note=note
        )


EquipmentProvisionApproval = LabProvisionApproval[EquipmentInstallationProvision]
EquipmentProvisionRejection = LabProvisionRejection[EquipmentInstallationProvision]
EquipmentProvisionDenial = LabProvisionDenial[EquipmentInstallationProvision]
EquipmentProvisionPurchase = LabProvisionPurchase[EquipmentInstallationProvision]
EquipmentProvisionComplete = LabProvisionComplete[EquipmentInstallationProvision]
EquipmentProvisionCancel = LabProvisionCancel[EquipmentInstallationProvision]


class EquipmentInstallationDetail(LabInstallationDetail[EquipmentInstallation]):
    equipment_id: UUID
    equipment_name: str

    model_name: str
    num_installed: int

    @classmethod
    def _allocation_index_from_installation(cls, installation: LabInstallation[Any]) -> EquipmentLeaseIndex:
        from .equipment_lease import EquipmentLeaseIndex
        if not isinstance(installation, EquipmentInstallation):
            raise TypeError('Expected an EquipmentInstallation')

        return EquipmentLeaseIndex(installation=installation.id, only_pending=True)

    @classmethod
    def _provision_index_from_installation(cls, installation: LabInstallation[Any]) -> EquipmentInstallationProvisionIndex:
        if not isinstance(installation, EquipmentInstallation):
            raise TypeError("Expected an EquipmentInstallation")
        return EquipmentInstallationProvisionIndex(installation=installation.id, only_pending=True)


    @classmethod
    async def from_model(
        cls,
        model: EquipmentInstallation,
    ):
        equipment_ = await model.awaitable_attrs.equipment

        return await cls._from_lab_installation(
            model,
            equipment_id=equipment_.id,
            equipment_name=equipment_.name,
            model_name=model.installed_model_name,
            num_installed=model.num_installed,
        )


class EquipmentInstallationIndex(ModelIndex[EquipmentInstallation]):
    lab: UUID | None = None
    equipment: UUID | None = None

    async def item_from_model(
        self, model: EquipmentInstallation
    ) -> ModelDetail[EquipmentInstallation]:
        return await EquipmentInstallationDetail.from_model(model)

    def get_selection(self):
        return query_equipment_installations(
            lab=self.lab,
            equipment=self.equipment,
        )


EquipmentInstallationIndexPage = ModelIndexPage[EquipmentInstallation, EquipmentInstallationDetail]

EquipmentDetail.model_rebuild()