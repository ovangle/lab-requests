from uuid import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql as psql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import local_object_session
from db.models.lab.installable.lab_installation import LabInstallation

from .equipment import Equipment


class EquipmentInstallation(LabInstallation[Equipment]):
    __installation_type__ = "equipment"
    __tablename__ = "equipment_installation"

    id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_installation.id"), primary_key=True
    )

    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("equipment.id"))
    equipment = relationship(Equipment, back_populates="installations")

    model_name: Mapped[str] = mapped_column(psql.TEXT)
    num_installed: Mapped[int] = mapped_column(psql.INTEGER, default=0)

    @property
    def installable_id(self):
        return self.equipment_id

    async def installable(self):
        db = local_object_session(self)
        return await Equipment.get_for_id(db, self.equipment_id)
