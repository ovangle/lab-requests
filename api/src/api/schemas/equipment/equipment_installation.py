from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal, override
from uuid import UUID

from api.schemas.base import ModelDetail
from api.schemas.equipment.equipment import EquipmentCreateRequest, EquipmentDetail
from api.schemas.lab.lab_provision import LabProvisionApproval, LabProvisionCancel, LabProvisionComplete, LabProvisionDenial, LabProvisionPurchase, LabProvisionRejection
from db import LocalSession, local_object_session
from db.models.equipment import (
    EquipmentInstallation,
    EquipmentInstallationProvision,
    query_equipment_installations,
)
from db.models.equipment.equipment import Equipment
from db.models.equipment.equipment_installation import query_equipment_installation_provisions
from db.models.equipment.equipment_lease import query_equipment_leases
from db.models.lab import Lab
from db.models.lab.installable.lab_installation import LabInstallation
from db.models.research.funding import ResearchFunding
from db.models.research.funding.research_budget import ResearchBudget
from db.models.user import User

from ..base import (
    ModelCreateRequest,
    ModelIndexPage,
    ModelRequestContextError,
    ModelUpdateRequest,
)
from ..lab.lab_installation import LabInstallationCreateRequest, LabInstallationDetail, LabInstallationProvisionCreateRequest, LabInstallationProvisionDetail

if TYPE_CHECKING:
    from .equipment_lease import EquipmentLeaseDetail


class EquipmentInstallationProvisionDetail(LabInstallationProvisionDetail[EquipmentInstallationProvision]):
    @classmethod
    async def from_model(cls, model: EquipmentInstallationProvision):
        return await cls._from_lab_installation_provision(model)



EquipmentInstallationProvisionIndexPage = ModelIndexPage[EquipmentInstallationProvision, EquipmentInstallationProvisionDetail]


class CreateEquipmentInstallationRequest(LabInstallationCreateRequest[EquipmentInstallation]):
    """
    Creates an equipment installation without creating a provision
    """

    equipment: EquipmentCreateRequest | UUID | None = None
    lab: Lab | UUID

    installed_model_name: str | None = None
    num_installed: int

    async def do_create(self, db: LocalSession, current_user: User | None = None, equipment: Equipment | UUID | None = None):
        if not current_user:
            raise ModelRequestContextError('No current user')

        if isinstance(self.equipment, EquipmentCreateRequest):
            equipment = await self.equipment.do_create(db, current_user=current_user)
        elif isinstance(self.equipment, UUID):
            equipment = self.equipment

        if equipment is None:
            raise ModelRequestContextError("No equipment in context")

        installation = EquipmentInstallation(
            self.lab,
            equipment,
            model_name=self.installed_model_name or '',
            num_installed=self.num_installed,
            created_by=current_user
        )
        db.add(installation)
        await db.commit()
        return installation

class UpdateEquipmentInstallationReqeust(ModelUpdateRequest[EquipmentInstallation]):
    model_name: str | None = None
    num_installed: int

    async def do_update(self, model: EquipmentInstallation, current_user: User | None = None, **kwargs) -> EquipmentInstallation:
        if not current_user:
            raise ModelRequestContextError('No current user')

        db = local_object_session(model)

        if self.num_installed != model.num_installed:
            model.num_installed = self.num_installed

        if self.model_name and self.model_name != model.installed_model_name:
            model.installed_model_name = self.model_name

        model.updated_by_id = current_user.id
        db.add(model)
        await db.commit()
        return model

EquipmentCreateRequest.model_rebuild()


class EquipmentInstallationProvisionCreateRequest(LabInstallationProvisionCreateRequest[EquipmentInstallationProvision, CreateEquipmentInstallationRequest]):
    pass


class NewEquipmentRequest(EquipmentInstallationProvisionCreateRequest):
    """
    Creates a provision, which, when completed will result in a new installation
    of the specified equipment.
    """
    __can_create_installation__ = True

    action: Literal['new_equipment']
    num_required: int

    @override
    async def _do_create_lab_installation_provision(
         self,
        db: LocalSession,
        type: str,
        installation: LabInstallation,
        *,
        budget: ResearchBudget,
        estimated_cost: float,
        purchase_url: str | None,
        purchase_instructions: str,
        current_user: User,
        note: str
    ) -> EquipmentInstallationProvision:
        if not isinstance(installation, EquipmentInstallation):
            raise TypeError("Expected an equipment installation")

        return await EquipmentInstallationProvision.new_equipment(
            db,
            installation,
            num_required=self.num_required,
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
            requested_by=current_user,
            note=note
        )


class TransferEquipmentRequest(EquipmentInstallationProvisionCreateRequest):
    type: Literal['equipment_transfer']
    num_transferred: int
    destination_lab: UUID

    @override
    async def _do_create_lab_installation_provision(
        self,
        db: LocalSession,
        installation: LabInstallation,
        *,
        budget: ResearchBudget,
        estimated_cost: float,
        purchase_url: str | None,
        purchase_instructions: str,
        current_user: User,
        note: str
    ):
        if not isinstance(installation, EquipmentInstallation):
            raise TypeError("Expected an equipment installation")

        destination_lab = await Lab.get_by_id(db, self.destination_lab)

        return await EquipmentInstallationProvision.transfer_equipment(
            db,
            installation,
            destination_lab,
            budget=budget,
            num_transferred=self.num_transferred,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
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
    def _allocation_index_from_installation(cls, installation: LabInstallation[Any]):
        from .equipment_lease import EquipmentLeaseIndexPage, EquipmentLeaseDetail
        if not isinstance(installation, EquipmentInstallation):
            raise TypeError('Expected an EquipmentInstallation')

        async def index(db: LocalSession):
            return await EquipmentLeaseIndexPage.from_selection(
                db,
                query_equipment_leases(installation=installation.id, only_pending=True),
                EquipmentLeaseDetail.from_model
            )
        return index


    @classmethod
    def _provision_index_from_installation(cls, installation: LabInstallation[Any]):
        from .equipment_installation import EquipmentInstallationProvisionIndexPage, EquipmentInstallationProvisionDetail
        if not isinstance(installation, EquipmentInstallation):
            raise TypeError("Expected an EquipmentInstallation")

        async def index(db: LocalSession):
            return await EquipmentInstallationProvisionIndexPage.from_selection(
                db,
                query_equipment_installation_provisions(installation=installation, only_pending=True),
                EquipmentInstallationProvisionDetail.from_model
            )

        return index


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


EquipmentInstallationIndexPage = ModelIndexPage[EquipmentInstallation, EquipmentInstallationDetail]

EquipmentDetail.model_rebuild()