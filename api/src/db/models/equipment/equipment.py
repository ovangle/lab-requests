from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as psql

from db import LocalSession
from db.models.lab.installable.lab_installation import LabInstallation

from ..base import Base
from ..base.fields import uuid_pk
from ..lab.installable.installable import Installable

from .errors import EquipmentDoesNotExist

if TYPE_CHECKING:
    from .equipment_installation import EquipmentInstallation


class Equipment(Installable, Base):
    __tablename__ = "equipment"

    id: Mapped[uuid_pk]
    name: Mapped[str] = mapped_column(psql.VARCHAR(128), index=True)
    description: Mapped[str] = mapped_column(psql.TEXT, default="")

    tags: Mapped[list[str]] = mapped_column(psql.ARRAY(psql.TEXT), server_default="{}")
    training_descriptions: Mapped[list[str]] = mapped_column(
        psql.ARRAY(psql.TEXT), server_default="{}"
    )

    equipment_installations: Mapped[list[EquipmentInstallation]] = relationship(
        back_populates="equipment"
    )

    async def installations(self) -> list[LabInstallation]:
        return await self.awaitable_attrs.equipment_installations

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        e = await db.get(Equipment, id)
        if e is None:
            raise EquipmentDoesNotExist(for_id=id)
        return e
