from uuid import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base
from ..lab.installable.lab_installation_provision import LabInstallationProvision

from .equipment import Equipment
from .equipment_installation import EquipmentInstallation


class EquipmentProvision(LabInstallationProvision[EquipmentInstallation], Base):
    __abstract__ = True
    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("equipment.id"))
    equipment: Mapped[Equipment] = relationship()

    installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("equipment_installation.id")
    )
    installation: Mapped[EquipmentInstallation] = relationship()

    def __init__(self, installation: EquipmentInstallation, **kwargs):
        self.installation_id = installation.id
        self.equipment_id = installation.equipment_id

        super().__init__(**kwargs)


class NewEquipmentProvision(EquipmentProvision):
    __provision_type__ = "new_equipment"
    __tablename__ = "equipment_provision__new_equipment"


class DeclareEquipmentProvision(EquipmentProvision):
    __provision_type__ = "declare_equipment"
    __tablename__ = "equipment_provision__declare_equipment"
