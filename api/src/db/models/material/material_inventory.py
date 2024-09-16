from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
import functools
from typing import TYPE_CHECKING, ClassVar, TypedDict, cast, override
from uuid import UUID, uuid4

from sqlalchemy import Column, ForeignKey, ScalarResult, Select, Table, UniqueConstraint, select
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr
from sqlalchemy.dialects import postgresql

from db import LocalSession, local_object_session
from db.models.base import Base, model_id, DoesNotExist
from db.models.fields import uuid_pk

from db.models.lab.allocatable import Allocatable
from db.models.lab.disposable.lab_disposal import LabDisposal
from db.models.lab.lab import Lab
from db.models.lab.storable import LabStorageContainer
from db.models.research.funding.purchase import ResearchPurchase
from db.models.research.funding.research_budget import ResearchBudget
from db.models.user import User

from .material import Material

if TYPE_CHECKING:
    from .material_allocation import MaterialConsumption, MaterialProduction


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
    __table_args__ = (
        UniqueConstraint("lab_id", "material_id", name="lab_material_uniq"),
    )

    id: Mapped[uuid_pk] = mapped_column()

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    material_id: Mapped[UUID] = mapped_column(ForeignKey("material.id"))
    material: Mapped[Material] = relationship(back_populates="inventories")

    imports: Mapped[list[MaterialInventoryImport]] = relationship(back_populates="inventory")

    async def imports_since_last_measured(self, of_type: MaterialInventoryImportType | None = None) -> ScalarResult[MaterialInventoryImport]:
        db = local_object_session(self)

        where_type_clauses = [
            MaterialInventoryImport.type == of_type
        ] if of_type else []


        return await db.scalars(
            select(MaterialInventoryImport).where(
                MaterialInventoryImport.inventory_id == self.id,
                MaterialInventoryImport.created_at >= self.last_measured_at,
                *where_type_clauses
            )
        )

    async def procurements_since_last_measured(self) -> ScalarResult[MaterialInventoryProcurement]:
        return await self.imports_since_last_measured(MaterialInventoryImportType.PROCUREMENT)

    async def productions_since_last_measured(self) -> ScalarResult[MaterialProduction]:
        return await self.imports_since_last_measured(MaterialInventoryImportType.PRODUCTION)

    exports: Mapped[list[MaterialInventoryExport]] = relationship(back_populates="inventory")

    async def exports_since_last_measured(
        self,
        of_type: MaterialInventoryExportType | None = None
    ) -> ScalarResult[MaterialInventoryExport]:
        db = local_object_session(self)

        where_type_clauses = [
            MaterialInventoryExport.type == of_type
        ] if of_type else []
        return await db.scalars(
            select(MaterialInventoryExport).where(
                MaterialInventoryExport.inventory_id == self.id,
                MaterialInventoryExport.created_at >= self.last_measured_at,
                *where_type_clauses
            )
        )

    async def dispositions_since_last_measured(self) -> ScalarResult[MaterialInventoryDisposition]:
        return await self.exports_since_last_measured(MaterialInventoryExportType.DISPOSITION)

    async def consumtpions_since_last_measured(self) -> ScalarResult[MaterialInventoryDisposition]:
        return await self.exports_since_last_measured(MaterialInventoryExportType.DISPOSITION)
    last_measured_quantity: Mapped[float] = mapped_column(postgresql.FLOAT, default=0.0)
    last_measured_at: Mapped[datetime] = mapped_column(postgresql.TIMESTAMP)
    last_measured_by_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    last_measured_note: Mapped[str] = mapped_column(postgresql.TEXT)

    async def estimated_quantity(self) -> float:
        quantity = self.last_measured_quantity
        for import_ in await self.imports_since_last_measured():
            quantity += import_.quantity
        for export_ in await self.exports_since_last_measured():
            quantity -= export_.quantity
        return quantity

    # An inventory can occupy an ordered list of storage containers
    # within a lab.
    storage_items: Mapped[list[LabStorageContainer]] = relationship(
        secondary=material_inventory_lab_storage_items
    )

    previous_measurement_jsons: Mapped[list[dict]] = mapped_column(
        postgresql.ARRAY(postgresql.JSONB), server_default="{}"
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

    @classmethod
    async def get_for_lab_material(cls, db: LocalSession, lab: Lab | UUID, material: Material | UUID) -> MaterialInventory:
        r = await db.scalar(
            select(MaterialInventory).where(
                MaterialInventory.lab_id == model_id(lab),
                MaterialInventory.material_id == model_id(material)
            )
        )

        if r is None:
            raise DoesNotExist('MaterialInventory', f'no inventory exists for {model_id(material)} in {model_id(lab)}')
        return r

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


    async def record_procurement(self, purchase: ResearchPurchase, quantity: float) -> MaterialInventoryProcurement:
        db = local_object_session(self)
        procurement = MaterialInventoryProcurement(self, purchase, quantity=quantity)
        db.add(procurement)
        await db.commit()
        return procurement

    async def record_disposition(self, quantity: float) -> MaterialInventoryDisposition:
        db = local_object_session(self)

        material: Material = await self.awaitable_attrs.material
        lab: Lab = await self.awaitable_attrs.lab

        lab_disposal = cast(LabDisposal, None)

        disposition = MaterialInventoryDisposition(self, lab_disposal, quantity=quantity)
        db.add(disposition)
        await db.commit()
        return disposition

    @override
    async def save(self):
        del self.previous_inventory_measurements
        return await super().save()


def query_material_inventories(
    lab: Lab | UUID | None = None
) -> Select[tuple[MaterialInventory]]:
    where_clauses: list = []

    if lab:
        where_clauses.append(MaterialInventory.lab_id == model_id(lab))

    return select(MaterialInventory).where(*where_clauses)

class MaterialInventoryImportType(Enum):
    PROCUREMENT = "procurement"
    PRODUCTION = "production"

MATERIAL_INVENTORY_IMPORT_TYPE_ENUM = postgresql.ENUM(MaterialInventoryImportType, name='material_inventory_import_type', create_type=False)

class MaterialInventoryImport(Base):
    """
    A quantity of items imported into the inventory
    """

    __tablename__ = 'material_inventory_import'
    __import_type__: ClassVar[MaterialInventoryImportType]

    def __init_subclass__(cls, **kw):
        import_type = getattr(cls, '__import_type__', None)
        if not isinstance(import_type, MaterialInventoryImportType):
            raise TypeError("InventoryImport sublcass has no __import_type__")

        cls.__mapper_args__ = {
            "polymorphic_on": "type",
            "polymorphic_identity": import_type.value
        }

        super().__init_subclass__(**kw)

    id: Mapped[uuid_pk] = mapped_column()
    type: Mapped[MaterialInventoryImportType] = mapped_column(MATERIAL_INVENTORY_IMPORT_TYPE_ENUM)

    inventory_id: Mapped[UUID] = mapped_column(ForeignKey("material_inventory.id"))
    inventory: Mapped[MaterialInventory] = relationship()

    quantity: Mapped[float] = mapped_column(postgresql.FLOAT, default=0.0)

    recorded_by_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    recorded_by: Mapped[User] = relationship()

    def __init__(self, inventory: MaterialInventory | UUID, quantity: float, recorded_by: User | UUID, **kw):
        self.type = type(self).__import_type__
        self.inventory_id = model_id(inventory)
        self.quantity = quantity
        self.recorded_by_id = model_id(recorded_by)
        super().__init__(**kw)


class MaterialInventoryProcurement(MaterialInventoryImport):
    __tablename__ = "material_inventory_procurement"
    __import_type__ = MaterialInventoryImportType.PROCUREMENT

    id: Mapped[UUID] = mapped_column(ForeignKey("material_inventory_import.id"), primary_key=True)

    purchase_id: Mapped[UUID] = mapped_column(ForeignKey("research_purchase.id"))
    purchase: Mapped[ResearchPurchase] = relationship()

    def __init__(self, inventory: MaterialInventory | UUID, purchase: ResearchPurchase, quantity: float, **kw):
        self.puchase_id = model_id(purchase)
        super().__init__(
            inventory,
            recorded_by=purchase.paid_by_id,
            quantity=quantity,
            **kw
        )


class MaterialInventoryExportType(Enum):
    CONSUMPTION = "consumption"
    DISPOSITION = "disposition"


MATERIAL_INVENTORY_EXPORT_TYPE_ENUM = postgresql.ENUM(MaterialInventoryExportType, name="material_inventory_export_type", create_type=False)


class MaterialInventoryExport(Base):
    """
    A quantity of items exported from an inventory
    """

    __tablename__ = 'material_inventory_export'
    __export_type__: ClassVar[MaterialInventoryExportType]

    __mapper_args__ = {
        "polymorphic_on": "type"
    }

    def __init_subclass__(cls, **kwargs):
        export_type = getattr(cls, '__export_type__', None)
        if not isinstance(export_type, MaterialInventoryExportType):
            raise TypeError("InventoryExport subclass must declare an export type")

        cls.__mapper_args__ = {
            "polymorphic_on": "type",
            "polymorphic_identity": export_type.value
        }
        super().__init_subclass__(**kwargs)

    id: Mapped[uuid_pk] = mapped_column()
    type: Mapped[MaterialInventoryExportType] = mapped_column(MATERIAL_INVENTORY_EXPORT_TYPE_ENUM)

    inventory_id: Mapped[UUID] = mapped_column(ForeignKey("material_inventory.id"))
    inventory: Mapped[MaterialInventory] = relationship()

    quantity: Mapped[float] = mapped_column(postgresql.FLOAT, default=0.0)

    recorded_by_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    recorded_by: Mapped[User] = relationship()

    def __init__(self, inventory: MaterialInventory | UUID, recorded_by: User | UUID, quantity: float, **kw):
        self.id = uuid4()
        self.type = type(self).__export_type__
        self.inventory_id = model_id(inventory)
        self.quantity = quantity
        self.recorded_by_id = model_id(recorded_by)

        super().__init__(**kw)


class MaterialInventoryDisposition(MaterialInventoryExport):
    """
    Represents a move of a quantity out of an inventory and into a lab disposal.
    """

    __tablename__ = "material_inventory_disposition"
    __export_type__ = MaterialInventoryExportType.DISPOSITION

    id: Mapped[UUID] = mapped_column(ForeignKey("material_inventory_export.id"), primary_key=True)

    disposal_id: Mapped[UUID] = mapped_column(ForeignKey("lab_disposal.id"))
    disposal: Mapped[LabDisposal] = relationship()

    def __init__(self, inventory: MaterialInventory | UUID, lab_disposal: LabDisposal | UUID, recorded_by: User | UUID, quantity: float):
        self.disposal_id = model_id(lab_disposal)
        super().__init__(inventory, quantity=quantity, recorded_by=recorded_by)
