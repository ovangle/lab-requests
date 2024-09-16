from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import ForeignKey, Select, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from db import LocalSession

from db.models.base import Base
from db.models.fields import uuid_pk
from db.models.lab.disposable.disposable import Disposable
from db.models.lab.lab import Lab
from db.models.lab.storable.storable import LabStorageStrategy, Storable

from .errors import MaterialDoesNotExist


if TYPE_CHECKING:
    from .material_inventory import MaterialInventory


class Material(Storable, Disposable, Base):
    __tablename__ = "material"

    id: Mapped[uuid_pk] = mapped_column()
    name: Mapped[str] = mapped_column(psql.VARCHAR(128), unique=True, index=True)

    unit_of_measurement: Mapped[str] = mapped_column(psql.VARCHAR(16))

    inventories: Mapped[list[MaterialInventory]] = relationship()


    @classmethod
    async def get_for_name(cls, db: LocalSession, name: str):
        material = await db.scalar(select(Material).where(Material.name == name))
        if not material:
            raise MaterialDoesNotExist(for_name=name)
        return material

    def __init__(self, name: str, **kwargs):
        self.name = name
        super().__init__(**kwargs)

def query_materials() -> Select[tuple[Material]]:
    raise NotImplementedError