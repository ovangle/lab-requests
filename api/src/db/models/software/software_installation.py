from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal, TypedDict
from uuid import UUID
from sqlalchemy import ForeignKey, Select, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql

from db import LocalSession
from db.models.base import model_id
from db.models.fields import uuid_pk

from db.models.lab import Lab
from db.models.lab.installable import LabInstallation
from db.models.lab.installable.lab_installation import LabInstallationProvisionParams
from db.models.lab.provisionable import LabProvision, ProvisionStatus, provisionable_action
from db.models.lab.provisionable.provisionable import ProvisionableTypeAction
from db.models.user import User
from .software import Software

if TYPE_CHECKING:
    from db.models.research.funding.research_budget import ResearchBudget

class SoftwareInstallationProvisionParams(LabInstallationProvisionParams):
    software_id: UUID

class NewSoftwareParams(SoftwareInstallationProvisionParams):
    action: Literal["new_software"]
    min_version: str
    requires_license: bool
    is_free_software: bool

def _new_software_params_to_json(params: NewSoftwareParams):
    return {
        "action": params["action"],
        "software_id": str(params["software_id"]),
        "installation_id": str(params["installation_id"]),
        "min_version": params["min_version"],
        "requires_license": params["requires_license"],
        "is_free_software": params["is_free_software"]
    }

def _new_software_params_from_json(json: dict[str, Any]) -> NewSoftwareParams:
    return {
        "action": "new_software",
        "software_id": UUID(json["software_id"]),
        "installation_id": UUID(json["installation_id"]),
        "min_version": json["min_version"],
        "requires_license": json["requires_license"],
        "is_free_software": json["is_free_software"]
    }

class UpgradeSoftwareParams(SoftwareInstallationProvisionParams):
    action: Literal["upgrade_software"]
    installation_id: UUID
    min_version: str

def _upgrade_software_params_to_json(params: UpgradeSoftwareParams):
    return {
        "action": "upgrade_software",
        "software_id": str(params["software_id"]),
        "installation_id": str(params["installation_id"]),
        "min_version": params["min_version"]
    }

def _upgrade_software_params_from_json(json: dict[str, Any]) -> UpgradeSoftwareParams:
    return {
        "action": "upgrade_software",
        "software_id": UUID(json["software_id"]),
        "installation_id": UUID(json["installation_id"]),
        "min_version": json["min_version"]
    }

def query_software_installation_provisions(
    installation: SoftwareInstallation | UUID | None = None,
    only_pending: bool=False
) -> Select[tuple[LabProvision]]:
    where_clauses: list = [
        LabProvision.provisionable_type == "software_installation"
    ]
    if installation:
        where_clauses.append(
            LabProvision.provisionable_id == model_id(installation)
        )

    if only_pending:
        pending_statuses = [status for status in ProvisionStatus if status.is_pending]
        where_clauses.append(
            LabProvision.status.in_(pending_statuses)
        )

    return select(LabProvision).where(*where_clauses)

class SoftwareInstallation(LabInstallation[Software]):
    __installation_type__ = "software"
    __tablename__ = "software_installation"

    @classmethod
    def __init_subclass__(cls, **kw):
        import debugpy; debugpy.breakpoint()
        super().__init_subclass__(*kw)

    id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_installation.id"), primary_key=True
    )
    software_id: Mapped[UUID] = mapped_column(ForeignKey("software.id"), index=True)
    software: Mapped[Software] = relationship()

    installed_version: Mapped[str] = mapped_column(postgresql.VARCHAR(64), index=True)

    @provisionable_action("new_software", _new_software_params_to_json, _new_software_params_from_json)
    async def new_software(
        self,
        *,
        budget: ResearchBudget,
        estimated_cost: float = 0.0,
        purchase_url: str | None = None,
        purchase_instructions: str = '',
        requested_by: User,
        min_version: str = 'any',
        requires_license: bool = False,
        is_free_software: bool = False,
        note: str
    ):
        lab = await self.awaitable_attrs.lab

        params: NewSoftwareParams = {
            "action": "new_software",
            "software_id": self.software_id,
            "installation_id": self.id,
            "min_version": min_version,
            "requires_license": requires_license,
            "is_free_software": is_free_software
        }

        return await self.create_provision(
            "new_software",
            params= params,
            lab=lab,
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
            requested_by=requested_by,
            note=note,
        )

    @provisionable_action("upgrade_software", _upgrade_software_params_to_json, _upgrade_software_params_from_json)
    async def upgrade_software(
        self,
        *,
        budget: ResearchBudget,
        estimated_cost: float = 0.0,
        purchase_url: str | None = None,
        purchase_instructions: str = '',
        requested_by: User,
        min_version: str = 'any',
        requires_license: bool = False,
        is_free_software: bool = False,
        note: str
    ):
        lab = await self.awaitable_attrs.lab

        params: UpgradeSoftwareParams = {
            "action": "upgrade_software",
            "software_id": self.software_id,
            "installation_id": self.id,
            "min_version": min_version,
        }

        return await self.create_provision(
            "upgrade_software",
            params= params,
            lab=lab,
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
            requested_by=requested_by,
            note=note,
        )


def query_software_installations(
    lab: Lab | UUID | None = None,
    software: Software | UUID | None = None,
) -> Select[tuple[SoftwareInstallation]]:
    where_clauses: list = []
    if lab is not None:
        where_clauses.append(
            SoftwareInstallation.lab_id == model_id(lab)
        )

    if software is not None:
        where_clauses.append(
            SoftwareInstallation.software_id == model_id(software)
        )

    return select(SoftwareInstallation).where(*where_clauses)
