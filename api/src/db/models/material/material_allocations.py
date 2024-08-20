from uuid import UUID
from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.models.base import Base
from db.models.fields import uuid_pk
from db.models.lab.allocatable import LabAllocation
from db.models.material.material import Material
from db.models.user import User
from .material_inventory import (
    MaterialConsumption,
    MaterialDisposal,
    MaterialInventory,
    MaterialProcurement,
    MaterialProduction,
)


class InputMaterial(LabAllocation[MaterialInventory]):
    __allocation_type__ = "input_material"
    __tablename__ = "input_material"

    id: Mapped[UUID] = mapped_column(ForeignKey("lab_allocation.id"), primary_key=True)

    material_id: Mapped[UUID] = mapped_column()
    material: Mapped[Material] = relationship()

    from_inventory_id: Mapped[UUID] = mapped_column(ForeignKey("material_inventory.id"))
    from_inventory: Mapped[MaterialInventory] = relationship()

    consumptions: Mapped[list[MaterialConsumption]] = relationship(
        back_populates="input_material"
    )

    async def record_consumption(
        self, amount: float, by: User, note: str
    ) -> MaterialConsumption:
        inventory: MaterialInventory = await self.awaitable_attrs.from_inventory
        return await inventory.add_consumption(
            amount, by, note=note, input_material=self
        )

    async def record_procurement(
        self, amount: float, by: User, note: str
    ) -> MaterialProcurement:
        inventory: MaterialInventory = await self.awaitable_attrs.from_inventory
        return await inventory.add_procurement(
            amount, by, note=note, input_material=self
        )

    async def record_disposal(
        self, amount: float, by: User, note: str
    ) -> MaterialDisposal:
        inventory: MaterialInventory = await self.awaitable_attrs.from_inventory
        return await inventory.add_disposal(amount, by, note=note, input_material=self)


class OutputMaterial(LabAllocation[MaterialInventory]):
    __allocation_type__ = "output_material"
    __tablename__ = "output_material"

    id: Mapped[UUID] = mapped_column(ForeignKey("lab_allocation.id"), primary_key=True)

    to_inventory_id: Mapped[UUID] = mapped_column(ForeignKey("material_inventory.id"))
    to_inventory: Mapped[MaterialInventory] = relationship()

    productions: Mapped[list[MaterialProduction]] = relationship(
        secondary="output_material_productions"
    )

    async def record_production(
        self, amount: float, by: User, *, note: str
    ) -> MaterialProduction:
        inventory: MaterialInventory = await self.awaitable_attrs.to_inventory
        return await inventory.add_production(
            amount, by, note=note, output_material=self
        )

    async def record_disposal(
        self, amount: float, by: User, *, note: str
    ) -> MaterialDisposal:
        inventory: MaterialInventory = await self.awaitable_attrs.to_inventory

        return await inventory.add_disposal(amount, by, note=note, output_material=self)
