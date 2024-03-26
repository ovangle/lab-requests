from datetime import date

from sqlalchemy import Select
from db.models.lab import LabResource
from db.models.lab.resources import EquipmentLease

from ...lab_equipment.schemas import LabEquipmentView, LabEquipmentProvisionView
from ...lab_resource import LabResourceParams, LabResourceView, LabResourceIndex


class LabEquipmentLeaseView(LabResourceView[EquipmentLease]):
    equipment: LabEquipmentView
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
            start_date=model.start_date,
            end_date=model.end_date,
            equipment_training_completed=set(model.equipment_training_completed),
            require_supervision=model.require_supervision,
            setup_instructions=model.setup_instructions,
        )


class LabEquipmentLeaseIndex(LabResourceIndex[LabEquipmentLeaseView]):
    __item_view__ = LabEquipmentLeaseView


class LabEquipmentLeaseParams(LabResourceParams):
    pass
