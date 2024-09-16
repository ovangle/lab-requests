from typing import Any
from uuid import UUID

from api.schemas.lab.lab_allocation import LabAllocationIndex
from db import LocalSession
from db.models.lab.installable.lab_installation import LabInstallation
from db.models.software import (
    Software,
    SoftwareInstallation,
    query_software_installations,
    SoftwareInstallationProvision,
    query_software_installation_provisions
)
from db.models.lab import Lab
from db.models.research.funding import ResearchFunding
from db.models.user import User
from ..base import (
    ModelDetail,
    ModelIndex,
    ModelIndexPage,
)
from ..lab.lab_installation import LabInstallationDetail, LabInstallationIndex, LabInstallationProvisionCreateRequest, LabInstallationProvisionDetail, LabInstallationProvisionIndex
from ..lab.lab_provision import LabProvisionApproval, LabProvisionCancel, LabProvisionComplete, LabProvisionDenial, LabProvisionPurchase, LabProvisionRejection


class SoftwareInstallationDetail(LabInstallationDetail[SoftwareInstallation]):
    software_id: UUID
    software_name: str
    installed_version: str

    @classmethod
    def _allocation_index_from_installation(cls, installation: LabInstallation[Any]) -> LabAllocationIndex[Any]:
        from .software_lease import SoftwareLeaseIndex
        return SoftwareLeaseIndex(installation=installation, only_active=True)

    @classmethod
    def _provision_index_from_installation(cls, installation: LabInstallation[Any]) -> LabAllocationIndex[Any]:
        return SoftwareInstallationProvisionIndex(installation=installation, only_pending=True)

    @classmethod
    async def from_model(
        cls,
        model: SoftwareInstallation,
    ):
        software: Software = await model.awaitable_attrs.software

        return await cls._from_lab_installation(
            model,
            software=model.software_id,
            software_name=software.name,
            installed_version=model.installed_version
        )


class SoftwareInstallationIndex(LabInstallationIndex[SoftwareInstallation]):
    software: UUID | None

    async def item_from_model(
        self, model: SoftwareInstallation
    ) -> ModelDetail[SoftwareInstallation]:
        return await SoftwareInstallationDetail.from_model(model)

    def get_selection(self):
        return query_software_installations()


SoftwareInstallationIndexPage = ModelIndexPage[SoftwareInstallation, SoftwareInstallationDetail]


class SoftwareInstallationProvisionDetail(LabInstallationProvisionDetail[SoftwareInstallationProvision]):
    software_id: UUID
    min_version: str

    requires_license: bool
    is_paid_software: bool

    @classmethod
    async def from_model(cls, model: SoftwareInstallationProvision):
        return await cls._from_lab_installation_provision(
            model,
            software_id=model.software_id,
            min_version=model.min_version,
            requires_license=model.requires_license,
            is_paid_software=model.is_paid_software
        )


class SoftwareInstallationProvisionIndex(LabInstallationProvisionIndex[SoftwareInstallationProvision]):
    async def item_from_model(self, item):
        return await SoftwareInstallationProvisionDetail.from_model(item)

    def get_selection(self):
        return query_software_installation_provisions(
            installation=self.installation,
            only_pending=self.only_pending
        )

class SoftwareInstallationProvisionCreateRequest(LabInstallationProvisionCreateRequest[SoftwareInstallationProvision]):
    async def get_installation(self, db: LocalSession):
        return await SoftwareInstallation.get_by_id(db, self.installation_id)

class NewSoftwareRequest(SoftwareInstallationProvisionCreateRequest):
    min_version: str

    async def do_create_lab_provision(self, db: LocalSession, type: str, *, lab: Lab, funding: ResearchFunding | None, current_user: User, note: str) -> SoftwareInstallationProvision:
        installation = await self.get_installation(db)

        return await SoftwareInstallationProvision.new_software(
            db,
            installation,
            quantity_required=self.num_required,
            min_version=self.min_version,
            requested_by=current_user,
            note=note
        )


class UpgradeSoftwareRequest(SoftwareInstallationProvisionCreateRequest):
    min_version: str

    async def do_create_lab_provision(self, db: LocalSession, type: str, *, lab: Lab, funding: ResearchFunding | None, current_user: User, note: str) -> SoftwareInstallationProvision:
        installation = await self.get_installation(db)

        return await SoftwareInstallationProvision.upgrade_software(
            db,
            installation,
            min_version=self.min_version,
            requested_by=current_user,
            note=note
        )

SoftwareProvisionApproval = LabProvisionApproval[SoftwareInstallationProvision]
SoftwareProvisionRejection = LabProvisionRejection[SoftwareInstallationProvision]
SoftareProvisionDenial = LabProvisionDenial[SoftwareInstallationProvision]
SoftwareProvisionPurchase = LabProvisionPurchase[SoftwareInstallationProvision]
SoftwareProvisionComplete = LabProvisionComplete[SoftwareInstallationProvision]
SoftwareProvisionCancel = LabProvisionCancel[SoftwareInstallationProvision]
