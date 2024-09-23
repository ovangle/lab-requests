from __future__ import annotations

from typing import Any, Awaitable, Literal, TypedDict
from uuid import UUID
from sqlalchemy import ForeignKey, ScalarResult, Select, UniqueConstraint, select
from sqlalchemy.dialects import postgresql as psql
from sqlalchemy.orm import Mapped, mapped_column, relationship


from db import LocalSession, local_object_session
from db.models.base import Base, model_id, DoesNotExist
from db.models.lab.installable.lab_installation import LabInstallation, LabInstallationProvisionParams
from db.models.lab.lab import Lab, query_labs
from db.models.lab.provisionable import LabProvision, ProvisionStatus, provisionable_action
from db.models.lab.provisionable.provision_status import ProvisionStatus
from db.models.research.funding.research_budget import ResearchBudget
from db.models.uni.campus import Campus
from db.models.uni.discipline import Discipline
from db.models.user import User

from .equipment import Equipment


class EquipmentInstallationDoesNotExist(DoesNotExist):
    def __init__(
        self,
        *,
        for_id: UUID | None = None,
        for_installable_lab: tuple[Equipment | UUID, Lab | UUID] | None = None
    ):
        msg = None
        if for_installable_lab is not None:
            installable, lab = for_installable_lab
            msg = f'Not found for installable {model_id(installable)} in lab {model_id(lab)} '

        super().__init__('EquipmentInstallation', msg, for_id=for_id)


class EquipmentProvisionParams(LabInstallationProvisionParams):
    equipment_id: UUID


class NewEquipmentProvisionParams(EquipmentProvisionParams):
    action: Literal["new_equipment"]
    num_required: int

def _new_equipment_params_to_json(params: NewEquipmentProvisionParams) -> dict[str, Any]:
    return {
        "action": "new_equipment",
        "installation_id": params["installation_id"],
        "equipment_id": params["equipment_id"],
        "num_required": params["num_required"]
    }

def _new_equipment_params_from_json(json: dict[str, Any]) -> NewEquipmentProvisionParams:
    return {
        "action": "new_equipment",
        "installation_id": UUID(json["installation_id"]),
        "equipment_id": UUID(json["equipment_id"]),
        "num_required": int(json["num_required"])
    }


class TransferEquipmentParams(EquipmentProvisionParams):
    action: Literal["equipment_transfer"]
    destination_lab_id: UUID
    num_transferred: int

def _transfer_equipment_params_to_json(params: TransferEquipmentParams):
    return {
        "action": "equipment_transfer",
        "equipment_id": params["equipment_id"],
        "installation_id": params["installation_id"],
        "destination_lab_id": str(params["destination_lab_id"]),
        "num_transferred": int(params["num_transferred"])
    }

def _transfer_equipment_params_from_json(json: dict[str, Any]) -> TransferEquipmentParams:
    return {
        "action": "equipment_transfer",
        "equipment_id": UUID(json["equipment_id"]),
        "installation_id": UUID(json["installation_id"]),
        "destination_lab_id": UUID(json["destination_lab_id"]),
        "num_transferred": json["num_transferred"]
    }



class EquipmentInstallation(LabInstallation[Equipment], Base):
    __tablename__ = "equipment_installation"

    __installation_type__ = "equipment"
    __allocation_type__ = "equipment_allocation"
    __provision_type__ = "equipment_provision"

    id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_installation.id"), primary_key=True
    )

    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("equipment.id"))
    equipment = relationship(Equipment, back_populates="equipment_installations")

    installed_model_name: Mapped[str] = mapped_column(psql.TEXT, default='')
    num_installed: Mapped[int] = mapped_column(psql.INTEGER, default=0)

    @provisionable_action("new_equipment", _new_equipment_params_to_json, _new_equipment_params_from_json)
    async def new_equipment(
        self,
        *,
        num_required: int = 1,
        budget: ResearchBudget,
        estimated_cost: float = 0.0,
        purchase_url: str | None = None,
        purchase_instructions: str  = '',
        note: str = '',
        requested_by: User
    ):
        lab = await self.awaitable_attrs.lab

        params: NewEquipmentProvisionParams = {
            "action": "new_equipment",
            "equipment_id": self.equipment_id,
            "installation_id": self.id,
            "num_required": num_required
        }

        return await self.create_provision(
            "new_equipment",
            params=params,
            lab=lab,
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
            note=note,
            requested_by=requested_by
        )

    @provisionable_action("transfer_equipment", _transfer_equipment_params_to_json, _transfer_equipment_params_from_json)
    async def transfer_equipment(
        self,
        *,
        destination_lab: Lab,
        num_transferred: int = 1,
        budget: ResearchBudget,
        estimated_cost: float = 0.0,
        purchase_url: str | None = None,
        purchase_instructions: str  = '',
        note: str = '',
        requested_by: User
    ):
        lab = await self.awaitable_attrs.lab

        params: TransferEquipmentParams = {
            "action": "equipment_transfer",
            "installation_id": self.id,
            "equipment_id": self.equipment_id,
            "destination_lab_id": destination_lab.id,
            "num_transferred": num_transferred
        }

        return self.create_provision(
            "new_equipment",
            params=params,
            lab=lab,
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
            note=note,
            requested_by=requested_by
        )



    async def apply_provision(
        self, provision: LabProvision[EquipmentInstallation, Any], *, by: User, note: str, **kwargs
    ):
        raise NotImplementedError

    @classmethod
    async def get_for_installable_lab(cls, db: LocalSession, installable: Equipment | UUID, lab: Lab | UUID) -> EquipmentInstallation:
        q = select(EquipmentInstallation).where(
            EquipmentInstallation.equipment_id == model_id(installable),
            EquipmentInstallation.lab_id == model_id(lab)
        )
        r = await db.scalar(q)

        if not r:
            raise EquipmentInstallationDoesNotExist(
                for_installable_lab=(installable, lab)
            )
        return r

    def __init__(self, lab: Lab | UUID, equipment: Equipment | UUID, *, created_by: User | UUID, model_name: str, num_installed: int):
        super().__init__(lab, equipment, created_by=created_by)
        self.equipment_id = model_id(equipment)
        self.installed_model_name = model_name
        self.num_installed = num_installed

    async def get_installable(self):
        return await self.awaitable_attrs.equipment

def query_equipment_installations(
    equipment: Select[tuple[Equipment]] | list[Equipment] | Equipment | UUID | None = None,
    lab: Select[tuple[Lab]] | list[Lab | UUID] | Lab | UUID | None = None,
    installed_campus: Select[tuple[Campus]] | list[Campus | UUID] | Campus | UUID | None = None,
    installed_discipline: list[Discipline] | Discipline | None = None
) -> Select[tuple[EquipmentInstallation]]:
    where_clauses: list = []

    if lab is not None:
        if installed_discipline is not None:
            lab = query_labs(discipline=installed_discipline)
        elif installed_campus is not None:
            lab = query_labs(campus=installed_campus)

    if isinstance(lab, Select):
        where_clauses.append(
            EquipmentInstallation.lab_id.in_(lab.scalar_subquery())
        )
    elif isinstance(lab, list):
        where_clauses.append(
            EquipmentInstallation.lab_id.in_([model_id(l) for l in lab])
        )
    elif lab is not None:
        where_clauses.append(
            EquipmentInstallation.lab_id == model_id(lab)
        )

    if isinstance(equipment, Select):
        where_clauses.append(
            EquipmentInstallation.equipment_id.in_(equipment.scalar_subquery())
        )
    elif isinstance(equipment, list):
        where_clauses.append(
            EquipmentInstallation.equipment_id.in_([model_id(e) for e in equipment])
        )
    elif equipment is not None:
        where_clauses.append(
            EquipmentInstallation.equipment_id == model_id(equipment)
        )

    return select(EquipmentInstallation).where(*where_clauses)


def query_equipment_installation_provisions(
    installation: EquipmentInstallation | UUID | None = None,
    only_pending: bool=False
) -> Select[tuple[LabProvision]]:
    where_clauses: list = [
        LabProvision.provisionable_type == "equipment_installation"
    ]
    if installation:
        where_clauses.append(
            LabProvision.action_params_json["installation_id"] == model_id(installation)
        )

    if only_pending:
        pending_statuses = [status for status in ProvisionStatus if status.is_pending]
        where_clauses.append(
            LabProvision.status.in_(pending_statuses)
        )

    return select(LabProvision).where(*where_clauses)