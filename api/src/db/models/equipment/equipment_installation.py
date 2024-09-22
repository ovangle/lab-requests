from __future__ import annotations

from typing import Any, Literal, TypedDict
from uuid import UUID
from sqlalchemy import ForeignKey, ScalarResult, Select, UniqueConstraint, select
from sqlalchemy.dialects import postgresql as psql
from sqlalchemy.orm import Mapped, mapped_column, relationship


from db import LocalSession, local_object_session
from db.models.base import Base, model_id, DoesNotExist
from db.models.lab.installable.lab_installation import LabInstallation, LabInstallationProvision
from db.models.lab.lab import Lab, query_labs
from db.models.lab.provisionable.lab_provision import LabProvision, ProvisionType
from db.models.lab.provisionable.provision_status import ProvisionStatus
from db.models.research.funding.research_budget import ResearchBudget
from db.models.uni.campus import Campus
from db.models.uni.discipline import Discipline
from db.models.user import User

from .equipment import Equipment


class EquipmentInstallationDoesNotExit(DoesNotExist):
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

    async def complete_provision(
        self, provision: LabProvision[Any], *, by: User, note: str, **kwargs
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
            raise EquipmentInstallationDoesNotExit(
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


class NewEquipmentParams(TypedDict):
    action: Literal["new_equipment"]
    num_required: int

def _new_equipment_params_to_json(params: NewEquipmentParams) -> dict[str, Any]:
    return {
        "action": "new_equipment",
        "num_required": params["num_required"]
    }

def new_equipment_params_from_provision(provision: EquipmentInstallationProvision) -> NewEquipmentParams:
    if provision.action != 'new_equipment':
        raise ValueError(f"Cannot parse action params from '{provision.action} provision. Expected 'new_equipment' provision")
    json = provision.action_params
    return {
        "action": "new_equipment",
        "num_required": int(json["num_required"])
    }


class TransferEquipmentParams(TypedDict):
    action: Literal["equipment_transfer"]
    destination_lab_id: UUID
    num_transferred: int

def _transfer_equipment_params_to_json(params: TransferEquipmentParams):
    return {
        "action": "equipment_transfer",
        "destination_lab_id": str(params["destination_lab_id"]),
        "num_transferred": int(params["num_transferred"])
    }

def transfer_equipment_params_from_provision(provision: EquipmentInstallationProvision) -> TransferEquipmentParams:
    if provision.action != 'equipment_transfer':
        raise ValueError(f"Cannot parse action params from '{provision.action} provision. Expected 'equipment_transfer' provision")

    json = provision.action_params
    return {
        "action": "equipment_transfer",
        "destination_lab_id": UUID(json["destination_lab_id"]),
        "num_transferred": json["num_transferred"]
    }

class EquipmentInstallationProvision(LabInstallationProvision[EquipmentInstallation]):
    __provision_type__ = ProvisionType(
        "equipment_installation_provision",
        actions={"new_equipment", "replace_equipment"}
    )
    __tablename__ = "equipment_installation_provision"

    id: Mapped[UUID] = mapped_column(ForeignKey("lab_provision.id"), primary_key=True)

    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("equipment.id"))
    equipment: Mapped[Equipment] = relationship()

    installation_id: Mapped[UUID] = mapped_column(ForeignKey("equipment_installation.id"))
    installation: Mapped[EquipmentInstallation] = relationship()

    @classmethod
    async def new_equipment(
        cls,
        db: LocalSession,
        installation: EquipmentInstallation,
        budget: ResearchBudget,
        *,
        num_required: int,
        estimated_cost: float,
        purchase_url: str | None,
        purchase_instructions: str,
        requested_by: User,
        note: str
    ):
        provision = cls(
            "new_equipment",
            installation,
            action_params=_new_equipment_params_to_json({
                "action": "new_equipment",
                "num_required": num_required
            }),
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
            requested_by=requested_by,
            note=note
        )
        db.add(provision)
        await db.commit()
        return provision

    @classmethod
    async def transfer_equipment(
        cls,
        db: LocalSession,
        installation: EquipmentInstallation,
        destination_lab: Lab,
        *,
        budget: ResearchBudget,
        estimated_cost: float,
        purchase_url: str | None,
        purchase_instructions: str,
        num_transferred: int,
        requested_by: User,
        note: str
    ):
        lab: Lab = await installation.awaitable_attrs.lab

        provision = cls(
            "equipment_transfer",
            installation,
            action_params=_transfer_equipment_params_to_json({
                "action": "equipment_transfer",
                "destination_lab_id": destination_lab.id,
                "num_transferred": num_transferred
            }),
            budget=budget,
            estimated_cost=estimated_cost,
            purchase_url=purchase_url,
            purchase_instructions=purchase_instructions,
            requested_by=requested_by,
            note=note
        )

        db.add(provision)
        await db.commit()
        return provision


def query_equipment_installation_provisions(
    installation: EquipmentInstallation | UUID | None = None,
    only_pending: bool=False
) -> Select[tuple[EquipmentInstallationProvision]]:
    where_clauses: list = []
    if installation:
        where_clauses.append(
            EquipmentInstallationProvision.installation_id == model_id(installation)
        )

    if only_pending:
        pending_statuses = [status for status in ProvisionStatus if status.is_pending]
        where_clauses.append(
            EquipmentInstallationProvision.status.in_(pending_statuses)
        )


    return select(EquipmentInstallationProvision).where(*where_clauses)