from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import Column, ForeignKey, Select, Table, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import local_object_session
from db.models.base import Base
from db.models.base.base import model_id
from db.models.base.errors import ModelException
from db.models.fields import uuid_pk
from db.models.lab.allocatable import LabAllocation
from db.models.material.material import Material
from db.models.user import User

from .material_inventory import (
    MaterialInventory,
    MaterialInventoryExportType,
    MaterialInventoryImport,
    MaterialInventoryExport,
    MaterialInventoryImportType
)

class MaterialAllocationError(ModelException):
    pass

class MaterialAllocation(LabAllocation[MaterialInventory]):
    __allocation_type__ = "material_allocation"
    __tablename__ = "material_allocation"

    id: Mapped[UUID] = mapped_column(ForeignKey("lab_allocation.id"), primary_key=True)

    material: Mapped[Material] = relationship(secondary="material_inventory", viewonly=True)

    inventory_id: Mapped[UUID] = mapped_column(ForeignKey("material_inventory.id"))
    inventory: Mapped[MaterialInventory] = relationship(overlaps="material")

    is_input: Mapped[bool] = mapped_column(postgresql.BOOLEAN)
    is_output: Mapped[bool] = mapped_column(postgresql.BOOLEAN)

    productions: Mapped[list[MaterialProduction]] = relationship(
        back_populates="output_material"
    )

    consumptions: Mapped[list[MaterialConsumption]] = relationship(
        back_populates="input_material"
    )

    def __init__(self, inventory: MaterialInventory | UUID, is_input: bool, is_output: bool, **kw):
        self.inventory_id = inventory.id
        if not (is_input or is_output):
            raise ValueError('Must be either an input or an output')
        self.is_input = is_input
        self.is_output = is_output
        super().__init__(**kw)


    async def record_consumption(
        self, quantity: float, by: User, note: str
    ) -> MaterialConsumption:
        db = local_object_session(self)

        if not self.is_input:
            raise MaterialAllocationError("Only an input allocation can record a consumption")

        inventory: MaterialInventory = await self.awaitable_attrs.inventory
        consumption = MaterialConsumption(
            input_material_id=self.id,
            inventory=inventory,
            quantity=quantity,
            recorded_by=by,
            note=note,
        )
        db.add(consumption)
        await db.commit()
        return consumption

    async def record_production(
        self, quantity: float, by: User, note: str
    ):
        db = local_object_session(self)
        if not self.is_output:
            raise MaterialAllocationError("Only an output material can record a production")
        production = MaterialProduction(
            output_material_id=self.id,
            inventory=self.inventory,
            quantity=quantity,
            recorded_by=by,
            note=note,
        )
        db.add(production)
        await db.commit()
        return production

def query_material_allocations(
    inventory: MaterialInventory | UUID | None = None,
    only_inputs: bool = False,
    only_outputs: bool = False
) -> Select[tuple[MaterialAllocation]]:
    where_clauses: list = []

    if inventory:
        where_clauses.append(MaterialAllocation.inventory_id == model_id(inventory))

    if only_inputs:
        where_clauses.append(MaterialAllocation.is_input == True)

    if only_outputs:
        where_clauses.append(MaterialAllocation.is_output == True)

    return select(MaterialAllocation).where(*where_clauses)


class MaterialConsumption(MaterialInventoryExport):
    __tablename__ = "material_consumption"
    __export_type__ = MaterialInventoryExportType.CONSUMPTION

    id: Mapped[UUID] = mapped_column(ForeignKey('material_inventory_export.id'), primary_key=True)

    input_material_id: Mapped[UUID] = mapped_column(ForeignKey('material_allocation.id'))
    input_material: Mapped[MaterialAllocation] = relationship(back_populates="consumptions")

    def __init__(
        self,
        input_material: MaterialAllocation,
        recorded_by: User | UUID,
        quantity: float
    ):
        self.input_material_id=input_material.id
        super().__init__(
            inventory=input_material.inventory_id,
            recorded_by=recorded_by,
            quantity=quantity
        )

def query_material_consumptions():
    raise NotImplementedError

class MaterialProduction(MaterialInventoryImport):
    __import_type__ = MaterialInventoryImportType.PRODUCTION
    __tablename__ = "output_material_production"

    id: Mapped[UUID] = mapped_column(ForeignKey("material_inventory_import.id"), primary_key=True)

    output_material_id: Mapped[UUID] = mapped_column(ForeignKey("material_allocation.id"))
    output_material: Mapped[MaterialAllocation] = relationship(back_populates="productions")

    def __init__(
        self,
        output_material: MaterialAllocation,
        recorded_by: User | UUID,
        quantity: float
    ):
        self.output_material_id =output_material.id
        super().__init__(
            inventory=output_material.inventory_id,
            recorded_by=recorded_by,
            quantity=quantity
        )


def query_material_productions():
    raise NotImplementedError
