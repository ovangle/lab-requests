from typing import Any, cast
from uuid import UUID

from api.schemas.software.software import SoftwareCreateRequest
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
from db.models.software.software_lease import query_software_leases
from db.models.user import User
from ..base import (
    ModelCreateRequest,
    ModelDetail,
    ModelIndexPage,
    ModelRequestContextError,
)
from ..lab.lab_installation import LabInstallationCreateRequest, LabInstallationDetail, LabInstallationProvisionCreateRequest, LabInstallationProvisionDetail
from ..lab.lab_provision import LabProvisionApproval, LabProvisionCancel, LabProvisionComplete, LabProvisionDenial, LabProvisionPurchase, LabProvisionRejection


class SoftwareInstallationDetail(LabInstallationDetail[SoftwareInstallation]):
    software_id: UUID
    software_name: str
    installed_version: str

    @classmethod
    def _allocation_index_from_installation(cls, installation: LabInstallation[Any]):
        from .software_lease import SoftwareLeaseDetail, SoftwareLeaseIndexPage

        async def index(db: LocalSession):
            return await SoftwareLeaseIndexPage.from_selection(
                db,
                query_software_leases(installation=cast(SoftwareInstallation, installation), only_pending=True),
                SoftwareLeaseDetail.from_model
            )
        return index

    @classmethod
    def _provision_index_from_installation(cls, installation: LabInstallation[Any]):
        from .software_installation import SoftwareInstallationProvisionDetail, SoftwareInstallationProvisionIndexPage

        async def index(db: LocalSession):
            return await SoftwareInstallationProvisionIndexPage.from_selection(
                db,
                query_software_installation_provisions(installation=cast(SoftwareInstallation, installation), only_pending=True),
                SoftwareInstallationProvisionDetail.from_model
            )

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

class SoftwareInstallationCreateRequest(LabInstallationCreateRequest[SoftwareInstallation]):
    software: SoftwareCreateRequest | UUID | None = None
    lab: Lab | UUID
    installed_version: str

    async def do_create(self, db: LocalSession, current_user: User | None = None, software: Software | None = None):
        if not current_user:
            raise ModelRequestContextError("No current user")

        if isinstance(self.software, SoftwareCreateRequest):
            software = await self.software.do_create(db, current_user=current_user)
        elif isinstance(self.software, UUID):
            software = await Software.get_by_id(db, self.software)

        if software is None:
            raise ModelRequestContextError("No software in context")

        software_installation = SoftwareInstallation(
            self.lab,
            software,
            installed_version=self.installed_version,
            created_by=current_user
        )
        db.add(software_installation)
        await db.commit()
        return software_installation


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


SoftwareInstallationProvisionIndexPage = ModelIndexPage[SoftwareInstallationProvision, SoftwareInstallationProvisionDetail]

class SoftwareInstallationProvisionCreateRequest(LabInstallationProvisionCreateRequest[SoftwareInstallationProvision, SoftwareInstallationCreateRequest]):
    async def get_installation(self, db: LocalSession):
        return await SoftwareInstallation.get_by_id(db, self.installation_id)

class NewSoftwareRequest(SoftwareInstallationProvisionCreateRequest):
    min_version: str

    async def do_create_lab_provision(self, db: LocalSession, type: str, *, lab: Lab, funding: ResearchFunding | None, current_user: User, note: str) -> SoftwareInstallationProvision:
        installation = await self.get_installation(db)

        return await SoftwareInstallationProvision.new_software(
            db,
            installation,
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
