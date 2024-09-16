
from uuid import UUID
from db.models.material import Material, MaterialInventory, query_material_inventories

from ..base import ModelDetail, ModelIndex, ModelIndexPage

class MaterialInventoryDetail(ModelDetail[MaterialInventory]):
    material_id: UUID
    material_name: str

    unit_of_measurement: str

    @classmethod
    async def from_model(cls, model: MaterialInventory):
        material: Material = await model.awaitable_attrs.material

        return await cls._from_base(
            model,
            material_id=material.id,
            material_name=material.name,
            unit_of_measurement=material.unit_of_measurement
        )


class MaterialInventoryIndex(ModelIndex[MaterialInventory]):
    lab: UUID | None = None

    async def item_from_model(self, model: MaterialInventory) -> ModelDetail[MaterialInventory]:
        return await MaterialInventoryDetail.from_model(model)

    def get_selection(self):
        return query_material_inventories(
            lab=self.lab
        )

MaterialInventoryIndexPage = ModelIndexPage[MaterialInventory, MaterialInventoryDetail]