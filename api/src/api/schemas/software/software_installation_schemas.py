from typing import Any, Generic, TypeVar, cast, override
from uuid import UUID

from db import LocalSession
from db.models.lab.installable.lab_installation import LabInstallation
from db.models.lab.provisionable.lab_provision import LabProvision
from db.models.research.funding.research_budget import ResearchBudget
from db.models.software import (
    Software,
    SoftwareInstallation,
    query_software_installations,
    query_software_installation_provisions
)
from db.models.lab import Lab
from db.models.research.funding import ResearchFunding
from db.models.software.software_installation import NewSoftwareParams, SoftwareInstallationProvisionParams, UpgradeSoftwareParams
from db.models.software.software_lease import query_software_leases
from db.models.user import User
from ..base import (
    ModelIndexPage,
    ModelRequestContextError,
)
from ..lab.lab_installation import LabInstallationCreateRequest, LabInstallationDetail, LabInstallationProvisionCreateRequest, LabInstallationProvisionDetail
from ..lab.lab_provision import LabProvisionApprovalRequest, LabProvisionCancelRequest, LabProvisionCompleteRequest, LabProvisionDenialRequest, LabProvisionPurchaseRequest, LabProvisionRejectionRequest, register_provision_detail_cls

from api.schemas.software import SoftwareCreateRequest
from .software import SoftwareDetail

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
            )
        return index

    @classmethod
    @override
    def _select_provisions(cls, installation: LabInstallation[Any]):
            return query_software_installation_provisions(installation=cast(SoftwareInstallation, installation), only_pending=True),

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


class SoftwareInstallationIndexPage(ModelIndexPage[SoftwareInstallation, SoftwareInstallationDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: SoftwareInstallation):
        return await SoftwareInstallationDetail.from_model(item)

SoftwareDetail.model_rebuild()

TParams = TypeVar('TParams', bound=SoftwareInstallationProvisionParams)


class SoftwareInstallationProvisionDetail(LabInstallationProvisionDetail[SoftwareInstallation, TParams], Generic[TParams]):
    software_id: UUID

    @classmethod
    @override
    async def _from_lab_provision(
        cls,
        provision: LabProvision[SoftwareInstallation, TParams],
        action: str,
        action_params: TParams,
        **kwargs
    ):
        return await super()._from_lab_provision(
            provision,
            action,
            action_params,
            software_id=action_params["software_id"],
            **kwargs
        )


class NewSoftwareProvisionDetail(SoftwareInstallationProvisionDetail[NewSoftwareParams]):
    min_version: str
    requires_license: bool
    is_free_software: bool

    @classmethod
    @override
    async def _from_lab_provision(
        cls,
        provision: LabProvision[SoftwareInstallation, NewSoftwareParams],
        action: str,
        action_params: NewSoftwareParams,
        **kwargs
    ):
        return await super()._from_lab_provision(
            provision,
            action,
            action_params,
            min_version=action_params["min_version"],
            requires_license=action_params["requires_license"],
            is_free_software=action_params["is_free_software"]
        )

register_provision_detail_cls("new_software", NewSoftwareProvisionDetail)

class UpgradeSoftwareProvisionDetail(SoftwareInstallationProvisionDetail[UpgradeSoftwareParams]):
    min_version: str

    @classmethod
    @override
    async def _from_lab_provision(
        cls,
        provision: LabProvision[SoftwareInstallation, UpgradeSoftwareParams],
        action: str,
        action_params: UpgradeSoftwareParams,
        **kwargs,
    ):
        return await super()._from_lab_provision(
            provision,
            action,
            action_params,
            min_version=action_params["min_version"],
            **kwargs,
        )

register_provision_detail_cls("upgrade_software", UpgradeSoftwareProvisionDetail)


class _SoftwareInstallationProvisionCreateRequest(LabInstallationProvisionCreateRequest[SoftwareInstallation, SoftwareInstallationCreateRequest]):
    pass

class NewSoftwareRequest(_SoftwareInstallationProvisionCreateRequest):
    min_version: str

    @override
    async def _do_create_lab_installation_provision(
        self,
        db: LocalSession,
        installation: LabInstallation,
        *,
        budget: ResearchBudget,
        estimated_cost: float,
        purchase_url: str,
        purchase_instructions: str,
        current_user: User,
        note: str
    ) -> LabProvision[SoftwareInstallation, Any]:
        if not isinstance(installation, SoftwareInstallation):
            raise TypeError("Expected a software installation")
        return await installation.new_software(
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
            requested_by=current_user,
            note=note
        )

class UpgradeSoftwareRequest(_SoftwareInstallationProvisionCreateRequest):
    min_version: str

    @override
    async def _do_create_lab_installation_provision(
        self,
        db: LocalSession,
        installation: LabInstallation,
        *,
        budget: ResearchBudget,
        estimated_cost: float,
        purchase_url: str,
        purchase_instructions: str,
        current_user: User,
        note: str
    ):
        if not isinstance(installation, SoftwareInstallation):
            raise TypeError(f"Expected a software installation")

        return await installation.upgrade_software(
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
            min_version=self.min_version,
            requested_by=current_user,
            note=note
        )