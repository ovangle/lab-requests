
from db import local_object_session
from db.models.material import Material, query_materials

from ..base import ModelDetail, ModelIndex

from .material_inventory import MaterialInventoryIndex, MaterialInventoryIndexPage


class MaterialDetail(ModelDetail[Material]):
    name: str
    unit_of_measurement: str

    inventories: MaterialInventoryIndexPage

    @classmethod
    async def from_model(cls, model: Material):
        db = local_object_session(model)
        inventory_index = MaterialInventoryIndex(material=model.id)

        return cls._from_base(
            model,
            name=model.name,
            unit_of_measurement=model.unit_of_measurement,
            inventories=await inventory_index.load_page(db)
        )

class MaterialIndex(ModelIndex[Material]):
    def item_from_model(self, model):
        return MaterialDetail.from_model(model)

    def get_selection(self):
        return query_materials()