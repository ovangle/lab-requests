from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from ...base import Base
from ...base.fields import uuid_pk
from ..lab import Lab
from .lab_storage_type import LabStorageType, LAB_STORAGE_TYPE


class LabStorage(Base):
    """
    Represents a static store of arbitrary materials.
    """

    __tablename__ = "lab_storage"

    id: Mapped[uuid_pk]

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    type: Mapped[LabStorageType] = mapped_column(LAB_STORAGE_TYPE)

    allocations: Mapped[list[LabStorageAllocation]] = relationship(
        back_populates="storage"
    )


class LabStorageAllocation(Base):
    """
    Represents a quantity of a material that is stored in the storage
    of the lab.
    """

    id: Mapped[uuid_pk]

    storage_id: Mapped[UUID] = mapped_column(ForeignKey("lab_storage.id"))
    material_id: Mapped[UUID] = mapped_column(ForeignKey("material.id"))
    material_allotment_id: Mapped[UUID] = mapped_column(
        ForeignKey("material_allotment.id")
    )

    # The quantity expressed in the natural units for the material
    quantity: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)

    # The period for which the storage will be occupied by this allocation.
    start_date: Mapped[date | None] = mapped_column(
        psql.DATE, nullable=True, default=None
    )
    end_date: Mapped[date | None] = mapped_column(
        psql.DATE, nullable=True, default=None
    )
