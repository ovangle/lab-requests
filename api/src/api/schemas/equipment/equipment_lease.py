from uuid import UUID
from ..base import ModelDetail, ModelIndexPage

from db.models.equipment import EquipmentLease, query_equipment_leases

from ..lab.lab_allocation import LabAllocationDetail
from .equipment_installation import EquipmentInstallationDetail


class EquipmentLeaseDetail(LabAllocationDetail[EquipmentLease]):
    installation: EquipmentInstallationDetail

    @classmethod
    async def from_model(cls, model: EquipmentLease):
        installation_detail = await EquipmentInstallationDetail.from_model(
            await model.awaitable_attrs.installation
        )
        return await cls._from_lab_allocation(
            model,
            installation=installation_detail
        )


EquipmentLeaseIndexPage = ModelIndexPage[EquipmentLease, EquipmentLeaseDetail]