from typing import override
from uuid import UUID

from db import local_object_session
from db.models.material import MaterialAllocation, Material, MaterialInventory, MaterialProduction, MaterialConsumption

from db.models.material.material_allocation import query_material_allocations, query_material_consumptions, query_material_productions

from api.schemas.lab import LabAllocationDetail
from ..base_schemas import ModelDetail, ModelIndexPage

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


class MaterialProductionIndexPage(ModelIndexPage[MaterialProduction, MaterialProductionDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: MaterialProduction):
        return await MaterialProductionDetail.from_model(item)


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


class MaterialConsumptionIndexPage(ModelIndexPage[MaterialConsumption, MaterialConsumptionDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: MaterialConsumption):
        return await MaterialConsumptionDetail.from_model(item)


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
        )
        consumptions = await MaterialConsumptionIndexPage.from_selection(
            db,
            query_material_consumptions(input_material=model.id),
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


class MaterialAllocationIndexPage(ModelIndexPage[MaterialAllocation, MaterialAllocationDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: MaterialAllocation):
        return await MaterialAllocationDetail.from_model(item)