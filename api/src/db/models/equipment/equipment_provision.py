from uuid import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr
from sqlalchemy.dialects import postgresql

from db.models.base import Base
from db.models.fields import uuid_pk
from db.models.lab.installable import LabInstallationProvision

from .equipment import Equipment
from .equipment_installation import EquipmentInstallation


class EquipmentInstallationProvision(
    LabInstallationProvision[EquipmentInstallation], Base
):
    __abstract__ = True

    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("equipment.id"))

    @declared_attr
    def equipment(self) -> Mapped[Equipment]:
        return relationship()

    installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("equipment_installation.id")
    )

    @declared_attr
    def installation(cls):
        return relationship(EquipmentInstallation)

    quantity_required: Mapped[float] = mapped_column(postgresql.FLOAT)

    def __init__(self, installation: EquipmentInstallation, **kwargs):
        self.installation_id = installation.id
        self.equipment_id = installation.equipment_id

        super().__init__(**kwargs)

    @property
    def target_id(self):
        return self.installation_id


class NewEquipmentProvision(EquipmentInstallationProvision):
    __provision_type__ = "new_equipment"
    __tablename__ = "equipment_provision__new_equipment"


class DeclareEquipmentProvision(EquipmentInstallationProvision):
    __provision_type__ = "declare_equipment"
    __tablename__ = "equipment_provision__declare_equipment"


class UpgradeEquipmentProvision(EquipmentInstallationProvision):
    __provision_type__ = "upgrade_equipment"
    __tablename__ = "equipment_provision__upgrade_equipment"
