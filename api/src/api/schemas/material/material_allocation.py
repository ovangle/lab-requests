from uuid import UUID

from api.schemas.base import ModelDetail, ModelIndexPage
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


MaterialProductionIndexPage = ModelIndexPage[MaterialProduction, MaterialProductionDetail]


class MaterialConsumptionDetail(ModelDetail[MaterialConsumption]):
    input_material_id: UUID
    inventory_id: UUID
    quantity: float

    @classmethod
    async def from_model(cls, model: MaterialConsumption):
        return await cls._from_base(
            model,
            input_material_id=model.input_material_id,
            inventory_id=model.inventory_id,
            quantity=model.quantity
        )


MaterialConsumptionIndexPage = ModelIndexPage[MaterialConsumption, MaterialConsumptionDetail]


class MaterialAllocationDetail(LabAllocationDetail[MaterialAllocation]):
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

        productions = await MaterialProductionIndexPage.from_selection(
            db,
            query_material_productions(output_material=model.id),
            MaterialProductionDetail.from_model
        )
        consumptions = await MaterialConsumptionIndexPage.from_selection(
            db,
            query_material_consumptions(input_material=model.id),
            MaterialConsumptionDetail.from_model
        )

        return await cls._from_lab_allocation(
            model,
            inventory_id=model.inventory_id,
            material_id=material.id,
            material_name=material.name,
            is_input=model.is_input,
            is_output=model.is_output,
            productions=productions,
            consumptions=consumptions
        )


MaterialAllocationIndexPage = ModelIndexPage[MaterialAllocation, MaterialAllocationDetail]