
from typing import override
from db import local_object_session
from db.models.material import Material, query_materials
from db.models.material.material_inventory import query_material_inventories


from ..base_schemas import ModelDetail, ModelIndexPage
from .material_inventory_schemas import MaterialInventoryIndexPage, MaterialInventoryIndexPage


class MaterialDetail(ModelDetail[Material]):
    name: str
    unit_of_measurement: str

    inventories: MaterialInventoryIndexPage

    @classmethod
    async def from_model(cls, model: Material):
        db = local_object_session(model)
        inventories = MaterialInventoryIndexPage.from_selection(
            db,
            query_material_inventories(material=model.id)
        )

        return cls._from_base(
            model,
            name=model.name,
            unit_of_measurement=model.unit_of_measurement,
            inventories=inventories
        )

class MaterialIndexPage(ModelIndexPage[Material, MaterialDetail]):
    @classmethod
    @override
    async def item_from_model(cls, model: Material):
        return await MaterialDetail.from_model(model)