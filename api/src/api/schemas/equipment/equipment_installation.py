from uuid import UUID

from api.schemas.base import ModelDetail
from db.models.equipment import (
    EquipmentInstallation,
    query_equipment_installations,
)
from ..base import (
    ModelIndex,
    ModelIndexPage,
)
from ..lab.lab_installation import LabInstallationDetail


class EquipmentInstallationDetail(LabInstallationDetail[EquipmentInstallation]):
    equipment: UUID
    equipment_name: str

    equipment_model_name: str
    num_installed: int

    @classmethod
    async def from_model(
        cls,
        model: EquipmentInstallation,
    ):
        equipment_ = await model.awaitable_attrs.equipment

        return await cls._from_lab_installation(
            model,
            equipment_name=equipment_.name,
            equipment_model_name=model.model_name,
            num_installed=model.num_installed,
        )


class EquipmentInstallationIndex(ModelIndex[EquipmentInstallation]):
    async def item_from_model(
        self, model: EquipmentInstallation
    ) -> ModelDetail[EquipmentInstallation]:
        return await EquipmentInstallationDetail.from_model(model)

    def get_selection(self):
        return query_equipment_installations()


EquipmentInstallationIndexPage = ModelIndexPage[EquipmentInstallation]
