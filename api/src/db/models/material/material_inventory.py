from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from ..base import Base
from ..base.fields import uuid_pk

from ..lab.storage import LabStorage
from .material import Material


class MaterialInventory(Base):
    """
    Represents a quantity of material which is stored in some lab.
    """

    id: Mapped[uuid_pk]

    material_id: Mapped[UUID] = mapped_column(ForeignKey("material.id"))
    material: Mapped[Material] = relationship()

    storage_id: Mapped[UUID] = mapped_column(ForeignKey("lab_storage.id"))
    storage: Mapped[LabStorage] = relationship()

    quantity: Mapped[float] = mapped_column(psql.FLOAT, default=0.0)
