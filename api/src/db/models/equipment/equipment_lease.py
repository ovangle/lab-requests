from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.models.base import Base
from db.models.fields import uuid_pk
from db.models.lab.allocatable import LabAllocation
from .equipment_installation import EquipmentInstallation


class EquipmentLease(LabAllocation[EquipmentInstallation]):
    __tablename__ = "equipment_lease"
    __allocation_type__ = "equipment_lease"

    id: Mapped[UUID] = mapped_column(ForeignKey("lab_allocation.id"), primary_key=True)

    installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("EquipmentInstallation.id")
    )
    installation: Mapped[EquipmentInstallation] = relationship()
