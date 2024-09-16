from uuid import UUID
from ..base import ModelDetail, ModelIndex, ModelIndexPage

from db.models.equipment import EquipmentLease, query_equipment_leases

from ..lab.lab_allocation import LabAllocationDetail, LabAllocationIndex
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

class EquipmentLeaseIndex(LabAllocationIndex[EquipmentLease]):
    installation: UUID | None = None

    def item_from_model(self, model: EquipmentLease):
        return EquipmentLeaseDetail.from_model(model)

    def get_selection(self):
        return query_equipment_leases(
            target=self.installation or self.target,
            only_pending=self.only_pending
        )


EquipmentLeaseIndexPage = ModelIndexPage[EquipmentLease, EquipmentLeaseDetail]