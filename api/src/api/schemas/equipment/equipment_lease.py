from typing import override
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


class EquipmentLeaseIndexPage(ModelIndexPage[EquipmentLease, EquipmentLeaseDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: EquipmentLease):
        return await EquipmentLeaseDetail.from_model(item)