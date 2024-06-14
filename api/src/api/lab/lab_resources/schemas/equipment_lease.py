from datetime import date
from uuid import UUID

from sqlalchemy import Select
from db import local_object_session
from db.models.lab import LabResource
from db.models.lab.lab_equipment import (
    LabEquipmentInstallation,
    LabEquipmentProvision,
    ProvisionStatus,
)
from db.models.lab.lab_resource import LabResourceAttrs
from db.models.lab.lab_resource_container import LabResourceContainer
from db.models.lab.resources import EquipmentLease
from db.models.lab.resources.equipment_lease import EquipmentLeaseAttrs

from api.equipment.schemas import (
    EquipmentProvisionRequest,
)
from ._common import LabResourcePatch, LabResourceView, LabResourceIndex


class LabEquipmentLeaseView(LabResourceView[EquipmentLease]):
    equipment: LabEquipmentView
    equipment_installation: LabEquipmentInstallationView
    equipment_provision: LabEquipmentProvisionView | None

    start_date: date | None
    end_date: date | None

    equipment_training_completed: set[str]
    require_supervision: bool

    setup_instructions: str

    @classmethod
    async def from_model(cls, model: EquipmentLease, **kwargs):
        equipment = await LabEquipmentView.from_model(
            await model.awaitable_attrs.equipment
        )

        equipment_installation_model = (
            await model.awaitable_attrs.equipment_installation
        )
        equipment_installation = await LabEquipmentInstallationView.from_model(
            equipment_installation_model
        )

        equipment_provision_model = await model.awaitable_attrs.equipment_provision
        if equipment_provision_model:
            equipment_provision = LabEquipmentProvisionView.from_model(
                equipment_provision_model
            )
        else:
            equipment_provision = None

        return await super().from_model(
            model,
            equipment=equipment,
            equipment_provision=equipment_provision,
            equipment_installation=equipment_installation,
            start_date=model.start_date,
            end_date=model.end_date,
            equipment_training_completed=set(model.equipment_training_completed),
            require_supervision=model.require_supervision,
            setup_instructions=model.setup_instructions,
        )


class LabEquipmentLeaseIndex(LabResourceIndex[LabEquipmentLeaseView]):
    __item_view__ = LabEquipmentLeaseView


class LabEquipmentLeasePatch(LabResourcePatch):
    equipment_installation: UUID | None
    equipment_provision: LabEquipmentProvisionRequest | UUID | None

    start_date: date | None
    end_date: date | None

    equipment_training_completed: set[str]

    require_supervision: bool
    setup_instructions: str

    async def as_attrs(
        self, container: LabResourceContainer, index: int
    ) -> EquipmentLeaseAttrs:
        base_attrs = await super().as_attrs(container, index)

        db = local_object_session(container)

        if isinstance(self.equipment_provision, UUID):
            equipment_provision = await LabEquipmentProvision.get_for_id(
                db, self.equipment_provision
            )
        elif isinstance(self.equipment_provision, LabEquipmentProvisionRequest):
            equipment_provision = await self.equipment_provision.do_create(db)
        else:
            equipment_provision = None

        if self.equipment_installation is None:
            if not equipment_provision:
                raise ValueError("Equipment provision must be provided for new install")
            if not equipment_provision.status == ProvisionStatus.REQUESTED:
                raise ValueError("Must be newly provisioned equipment")
            equipment_installation = (
                await equipment_provision.awaitable_attrs.installation
            )
        elif isinstance(self.equipment_installation, UUID):
            equipment_installation = await LabEquipmentInstallation.get_for_id(
                db, self.equipment_installation
            )

        return {
            **base_attrs,
            "equipment_installation": equipment_installation,
            "equipment_provision": equipment_provision,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "equipment_training_completed": self.equipment_training_completed,
            "require_supervision": self.require_supervision,
            "setup_instructions": self.setup_instructions,
        }
