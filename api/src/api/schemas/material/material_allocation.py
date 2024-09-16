from uuid import UUID

from api.schemas.base import ModelDetail, ModelIndex, ModelIndexPage
from db import local_object_session
from db.models.material import MaterialAllocation, Material, MaterialInventory, MaterialProduction, MaterialConsumption

from api.schemas.lab.lab_allocation import LabAllocationDetail
from db.models.material.material_allocation import query_material_allocations, query_material_consumptions, query_material_productions


class MaterialProductionDetail(ModelDetail[MaterialProduction]):
    output_material_id: UUID
    inventory_id: UUID
    quantity: float

    @classmethod
    async def from_model(cls, model: MaterialProduction):
        return await cls._from_base(
            model,
            output_material_id=model.output_material_id,
            inventory_id=model.inventory_id,
            quantity=model.quantity
        )


class MaterialProductionIndex(ModelIndex[MaterialProduction]):
    output_material: UUID | None

    async def item_from_model(self, model: MaterialProduction):
        return await MaterialProductionDetail.from_model(model)

    def get_selection(self):
        return query_material_productions(
            output_material=self.output_material
        )


MaterialProductionIndexPage = ModelIndexPage[MaterialProduction, MaterialProductionDetail]


class MaterialConsumptionDetail(ModelDetail[MaterialConsumption]):
    input_material_id: UUID
    inventory_id: UUID
    quantity: float

    @classmethod
    async def from_model(cls, model: MaterialProduction):
        return await cls._from_base(
            model,
            input_material_id=model.input_material_id,
            inventory_id=model.inventory_id,
            quantity=model.quantity
        )

class MaterialConsumptionIndex(ModelIndex[MaterialConsumption]):
    input_material: UUID | None

    async def item_from_model(self, model: MaterialConsumption):
        return await MaterialConsumptionDetail.from_model(model)

    def get_selection(self):
        return query_material_consumptions(
            input_material=self.input_material
        )


MaterialConsumptionIndexPage = ModelIndexPage[MaterialConsumption, MaterialConsumptionDetail]


class MaterialAllocationDetail(LabAllocationDetail[MaterialInventory]):
    inventory_id: UUID
    material_id: UUID
    material_name: str

    is_input: bool
    is_output: bool

    productions: MaterialProductionIndexPage
    consumptions: MaterialConsumptionIndexPage

    @classmethod
    async def from_model(cls, model: MaterialAllocation):
        db = local_object_session(model)
        material: Material = await model.awaitable_attrs.material

        production_index = MaterialProductionIndex(
            output_material=model.id
        )
        consumption_index = MaterialConsumptionIndex(
            input_material=model.id
        )

        return cls._from_lab_allocation(
            model,
            inventory_id=model.inventory_id,
            material_id=material.id,
            material_name=material.name,
            is_input=model.is_input,
            is_output=model.is_output,
            productions=await production_index.load_page(db),
            consumptions=await consumption_index.load_page(db)
        )

class MaterialAllocationIndex(ModelIndex[MaterialAllocation]):
    inventory: UUID | None = None
    only_inputs: bool = False
    only_outputs: bool = False

    async def item_from_model(self, model: MaterialAllocation) -> ModelDetail[MaterialAllocation]:
        return await MaterialAllocationDetail.from_model(model)

    def get_selection(self):
        return query_material_allocations(
            inventory=self.inventory,
            only_inputs=self.only_inputs,
            only_outputs=self.only_outputs,
        )

MaterialAllocationIndexPage = ModelIndexPage[MaterialAllocation, MaterialAllocationDetail]