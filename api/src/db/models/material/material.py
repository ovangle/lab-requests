from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import ForeignKey, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from db import LocalSession

from ..base import Base
from ..base.fields import uuid_pk

from ..lab.storage import LAB_STORAGE_TYPE, LabStorageType

from .errors import MaterialDoesNotExist


if TYPE_CHECKING:
    from .material_inventory import MaterialInventory


class Material(Base):
    __tablename__ = "material"

    id: Mapped[uuid_pk]
    name: Mapped[str] = mapped_column(psql.VARCHAR(128), unique=True, index=True)

    unit_of_measurement: Mapped[str] = mapped_column(psql.VARCHAR(16))

    @classmethod
    async def get_for_name(cls, db: LocalSession, name: str):
        material = await db.scalar(select(Material).where(Material.name == name))
        if not material:
            raise MaterialDoesNotExist(for_name=name)
        return material

    def __init__(self, name: str, **kwargs):
        self.name = name
        super().__init__(**kwargs)


class InputMaterial(Base):
    """
    Represents a quantity of a material which is kept in stock in order
    to supply research plans conducted in a lab.
    """

    __tablename__ = "input_material"

    id: Mapped[uuid_pk]

    material_id: Mapped[UUID] = mapped_column(ForeignKey("material.id"))
    material: Mapped[Material] = relationship()

    from_inventory_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("material_inventory.id"), nullable=True, default=None
    )
    from_inventory: Mapped[MaterialInventory | None] = relationship()

    # Estimated and actual amounts consumed, expresed as an amount of the natural unit
    estimated_amount_consumed: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)
    amount_consumed: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)


class OutputMaterial(Base):
    """
    Represents a quantity of a material which is produced as a byproduct
    of the lab
    """

    __tablename__ = "output_material"

    id: Mapped[uuid_pk]

    material_id: Mapped[UUID] = mapped_column(ForeignKey("material.id"))
    material: Mapped[Material] = relationship()

    to_inventory_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("material_inventory.id"), nullable=True, default=None
    )
    to_inventory: Mapped[MaterialInventory | None] = relationship()

    # Estimated and actual amounts consumed, expresed as an amount of the natural unit
    estimated_amount_produced: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)
    amount_produced: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)
