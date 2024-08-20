from __future__ import annotations

from datetime import datetime, timezone
import functools
from typing import TYPE_CHECKING, TypedDict, override
from uuid import UUID, uuid4

from sqlalchemy import Column, ForeignKey, ScalarResult, Table, select
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr
from sqlalchemy.dialects import postgresql as psql

from db import local_object_session
from db.models.base import Base, model_id
from db.models.base.errors import ModelException
from db.models.fields import uuid_pk

from db.models.lab.allocatable import Allocatable
from db.models.lab.storable import LabStorageContainer
from db.models.user import User

from .material import Material

if TYPE_CHECKING:
    from .material_allocations import OutputMaterial, InputMaterial

material_inventory_lab_storage_items = Table(
    "material_inventory_lab_storage_items",
    Base.metadata,
    Column("inventory_id", ForeignKey("material_inventory.id"), primary_key=True),
    Column(
        "storage_container_id", ForeignKey("lab_storage_container.id"), primary_key=True
    ),
)


class InventoryMeasurement(TypedDict):
    inventory_id: UUID
    quantity: float
    by_id: UUID
    at: datetime
    note: str


def _inventory_measurement_to_json(m: InventoryMeasurement):
    return dict(
        inventory_id=m["inventory_id"],
        quantity=m["quantity"],
        by_id=str(m["by_id"]),
        at=m["at"].isoformat(),
        note=m["note"],
    )


def _inventory_measurement_from_json(m: dict) -> InventoryMeasurement:
    return InventoryMeasurement(
        inventory_id=UUID(m["inventory_id"]),
        quantity=float(m["quantity"]),
        by_id=UUID(m["by_id"]),
        at=datetime.fromisoformat(m["at"]),
        note=m["note"],
    )


class MaterialInventory(Allocatable, Base):
    """
    Represents a quantity of material which is stored in some lab.
    """

    __tablename__ = "material_inventory"

    id: Mapped[uuid_pk] = mapped_column()

    material_id: Mapped[UUID] = mapped_column(ForeignKey("material.id"))
    material: Mapped[Material] = relationship()

    procurements: Mapped[list[MaterialProcurement]] = relationship()

    async def procurements_since_last_measured(
        self,
    ) -> ScalarResult[MaterialProcurement]:
        db = local_object_session(self)
        return await db.scalars(
            select(MaterialProcurement).where(
                MaterialProcurement.inventory_id == self.id,
                MaterialProcurement.created_at >= self.last_measured_at,
            )
        )

    disposals: Mapped[list[MaterialDisposal]] = relationship()

    async def disposals_since_last_measured(self) -> ScalarResult[MaterialDisposal]:
        db = local_object_session(self)
        return await db.scalars(
            select(MaterialDisposal).where(
                MaterialDisposal.inventory_id == self.id,
                MaterialDisposal.created_at >= self.last_measured_at,
            )
        )

    productions: Mapped[list[MaterialProduction]] = relationship()

    async def productions_since_last_measured(self) -> ScalarResult[MaterialProduction]:
        db = local_object_session(self)
        return await db.scalars(
            select(MaterialProduction).where(
                MaterialProduction.inventory_id == self.id,
                MaterialProduction.created_at >= self.last_measured_at,
            )
        )

    consumptions: Mapped[list[MaterialProduction]] = relationship()

    async def consumptions_since_last_measured(
        self,
    ) -> ScalarResult[MaterialConsumption]:
        db = local_object_session(self)
        return await db.scalars(
            select(MaterialConsumption).where(
                MaterialConsumption.inventory_id == self.id,
                MaterialConsumption.created_at >= self.last_measured_at,
            )
        )

    last_measured_quantity: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)
    last_measured_at: Mapped[datetime] = mapped_column(psql.TIMESTAMP)
    last_measured_by_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    last_measured_note: Mapped[str] = mapped_column(psql.TEXT)

    async def estimated_quantity(self) -> float:
        quantity = self.last_measured_quantity
        for production in await self.productions_since_last_measured():
            quantity += production.quantity

        for consumption in await self.consumptions_since_last_measured():
            quantity -= consumption.quantity

        for procurement in await self.procurements_since_last_measured():
            quantity += procurement.quantity
        for disposal in await self.disposals_since_last_measured():
            quantity -= disposal.quantity
        return quantity

    # An inventory can occupy an ordered list of storage containers
    # within a lab.
    storage_items: Mapped[list[LabStorageContainer]] = relationship(
        secondary=material_inventory_lab_storage_items
    )

    previous_measurement_jsons: Mapped[list[dict]] = mapped_column(
        psql.ARRAY(psql.JSONB), server_default="{}"
    )

    @functools.cached_property
    def previous_inventory_measurements(self) -> list[InventoryMeasurement]:
        return [
            _inventory_measurement_from_json(m) for m in self.previous_measurement_jsons
        ]

    @property
    def last_measurement(self) -> InventoryMeasurement:
        return InventoryMeasurement(
            inventory_id=self.id,
            quantity=self.last_measured_quantity,
            at=self.last_measured_at,
            by_id=self.last_measured_by_id,
            note=self.last_measured_note,
        )

    def _set_last_measurement(
        self,
        quantity: float,
        measured_by: User,
        note: str,
        previous: InventoryMeasurement | None = None,
    ):
        if not previous:
            self.previous_measurement_jsons = []
        else:
            self.previous_measurement_jsons.append(
                _inventory_measurement_to_json(previous)
            )

        self.last_measured_at = datetime.now(tz=timezone.utc)
        self.last_measured_quantity = quantity
        self.last_measured_by_id = measured_by.id
        self.last_measured_note = note

        self.previous_measurement_jsons = []

    def __init__(self, material: Material, initial_quantity: float, created_by: User):
        self.id = uuid4()
        self.material_id = material.id
        self._set_last_measurement(
            initial_quantity, created_by, "initial measurement", previous=None
        )

        return super().__init__()

    async def record_measurement(
        self, quantity: float, by: User, note: str
    ) -> InventoryMeasurement:
        self._set_last_measurement(quantity, by, note, previous=self.last_measurement)
        await self.save()
        return self.last_measurement

    @override
    async def save(self):
        del self.previous_inventory_measurements
        return await super().save()

    async def add_consumption(
        self,
        amount: float,
        by: User,
        note: str,
        input_material: InputMaterial | None = None,
    ):
        """
        Adds a consumption of the item in the inventory
        """

        if input_material and input_material.from_inventory_id != self.id:
            raise ModelException("Input material from different inventory")
        consumption = MaterialConsumption(
            self,
            amount,
            by,
            note=note,
            input_material=input_material,
        )
        async with local_object_session(self) as db:
            db.add(consumption)
            await db.commit()
        return consumption

    async def add_procurement(
        self,
        amount: float,
        by: User,
        note: str,
        input_material: InputMaterial | None = None,
    ):
        if input_material and input_material.from_inventory_id != self.id:
            raise ModelException("Cannot connect output to different inventory")

        procurement = MaterialProcurement(
            self,
            amount,
            by,
            note=note,
            input_material=input_material,
        )

        async with local_object_session(self) as db:
            db.add(procurement)
            await db.commit()
        return procurement

    async def add_production(
        self,
        amount: float,
        by: User,
        *,
        note: str,
        output_material: OutputMaterial | None,
    ):
        if output_material and output_material.to_inventory_id != self.id:
            raise ModelException("OutputMaterial from different inventory")

        production = MaterialProduction(
            self,
            amount,
            by,
            note=note,
            output_material=output_material,
        )

        async with local_object_session(self) as db:
            db.add(production)
            await db.commit()
        return production

    async def add_disposal(
        self,
        amount: float,
        by: User,
        *,
        note: str,
        output_material: OutputMaterial | None = None,
        input_material: InputMaterial | None = None,
    ):
        disposal = MaterialDisposal(
            self,
            amount,
            by,
            note=note,
            input_material=input_material,
            output_material=output_material,
        )
        async with local_object_session(self) as db:
            db.add(disposal)
            await db.commit()
        return disposal


class _InventoryModifier(Base):
    __abstract__ = True

    material_id: Mapped[UUID] = mapped_column(ForeignKey("material.id"))

    @declared_attr
    def material(cls):
        return relationship(Material)

    inventory_id: Mapped[UUID] = mapped_column(ForeignKey("material_inventory.id"))

    @declared_attr
    def inventory(cls):
        return relationship(MaterialInventory)

    input_material_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("input_material.id"),
        nullable=True,
        default=None,
    )
    output_material_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("output_material.id"),
        nullable=True,
        default=None,
    )

    quantity: Mapped[float] = mapped_column(psql.FLOAT)

    by_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))

    @declared_attr
    def by(cls) -> Mapped[User]:
        return relationship(User)

    note: Mapped[str] = mapped_column(psql.TEXT)

    def __init__(
        self,
        material_inventory: MaterialInventory,
        quantity: float,
        by: User,
        *,
        note: str,
        input_material: InputMaterial | None = None,
        output_material: OutputMaterial | None = None,
        **kwargs,
    ):
        self.material_id = material_inventory.material_id
        self.inventory_id = material_inventory.id
        self.quantity = quantity

        if input_material:
            if input_material.from_inventory_id != self.inventory_id:
                raise ModelException("InputMaterial targets unexpected inventory")
            self.input_material_id = input_material.id if input_material else None
        if output_material:
            if output_material.to_inventory_id != self.inventory_id:
                raise ModelException("OutputMaterial targets unexpected inventory")
            self.output_material_id = output_material.id if output_material else None

        self.by_id = by.id
        self.note = note

        super().__init__(**kwargs)


class _InventoryImport(_InventoryModifier, Base):
    __abstract__ = True

    def __init__(
        self,
        to_inventory: MaterialInventory,
        quantity: float,
        by: User,
        *,
        note: str,
        input_material: InputMaterial | None = None,
        output_material: OutputMaterial | None = None,
        **kwargs,
    ):
        super().__init__(
            to_inventory,
            quantity,
            by,
            note=note,
            input_material=input_material,
            output_material=output_material,
            **kwargs,
        )


class _InventoryExport(_InventoryModifier):
    __abstract__ = True

    def __init__(
        self,
        from_inventory: MaterialInventory,
        quantity: float,
        by: User,
        note: str,
        input_material: InputMaterial | None = None,
        output_material: OutputMaterial | None = None,
    ):
        super().__init__(
            from_inventory,
            quantity,
            by,
            note=note,
            input_material=input_material,
            output_material=output_material,
        )


class MaterialConsumption(_InventoryExport):
    __tablename__ = "material_consumption"

    id: Mapped[uuid_pk] = mapped_column()

    def __init__(
        self,
        from_inventory: MaterialInventory,
        quantity: float,
        by: User,
        *,
        note: str,
        input_material: InputMaterial | None = None,
    ):
        super().__init__(
            from_inventory, quantity, by, note=note, input_material=input_material
        )


class MaterialProduction(_InventoryImport):
    __tablename__ = "material_production"

    id: Mapped[uuid_pk] = mapped_column()

    def __init__(
        self,
        from_inventory: MaterialInventory,
        quantity: float,
        by: User,
        *,
        note: str,
        output_material: OutputMaterial | None = None,
    ):
        super().__init__(
            from_inventory, quantity, by, note=note, output_material=output_material
        )


class MaterialProcurement(_InventoryImport):
    __tablename__ = "material_procurement"

    id: Mapped[uuid_pk] = mapped_column()

    def __init__(
        self,
        to_inventory: MaterialInventory,
        quantity: float,
        by: User,
        *,
        note: str,
        input_material: InputMaterial | None = None,
    ):
        super().__init__(
            to_inventory, quantity, by, note=note, input_material=input_material
        )


class MaterialDisposal(_InventoryExport):
    __tablename__ = "material_disposal"

    id: Mapped[uuid_pk] = mapped_column()

    def __init__(
        self,
        to_inventory: MaterialInventory,
        quantity: float,
        by: User,
        *,
        note: str,
        input_material: InputMaterial | None = None,
        output_material: OutputMaterial | None = None,
    ):
        super().__init__(
            to_inventory,
            quantity,
            by,
            note=note,
            input_material=input_material,
            output_material=output_material,
        )
