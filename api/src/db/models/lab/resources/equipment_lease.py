from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import LocalSession
from db.models.base.errors import DoesNotExist

from ..lab_resource import LabResource, LabResourceType, lab_resource_pk

if TYPE_CHECKING:
    from ..lab_resource_container import LabResourceContainer
    from ..lab_equipment import LabEquipment, LabEquipmentProvision


class EquipmentLease(LabResource):
    """
    Represents a reservation of a piece of lab equipment
    required by a research plan
    """

    __tablename__ = "lab_equipment_lease"
    __mapper_args__ = {
        "polymorphic_identity": LabResourceType.EQUIPMENT_LEASE,
    }
    id: Mapped[lab_resource_pk]

    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("lab_equipment.id"))
    equipment: Mapped[LabEquipment] = relationship()

    equipment_provision_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("lab_equipment_provision.id"),
        nullable=True,
        server_default=None,
    )
    equipment_provision: Mapped[LabEquipmentProvision | None] = relationship()

    start_date: Mapped[datetime | None] = mapped_column(
        postgresql.TIME(timezone=True), nullable=True, server_default=None
    )
    end_date: Mapped[datetime | None] = mapped_column(
        postgresql.TIME(timezone=True), nullable=True, server_default=None
    )

    # The training completed for the
    equipment_training_completed: Mapped[set[str]] = mapped_column(
        postgresql.ARRAY(postgresql.TEXT), server_default="{}"
    )
    require_supervision: Mapped[bool] = mapped_column(postgresql.BOOLEAN)

    setup_instructions: Mapped[str] = mapped_column(postgresql.TEXT)

    def __init__(self, *, equipment: LabEquipment | LabEquipmentProvision, **kwargs):
        from ..lab_equipment import LabEquipment, LabEquipmentProvision

        if isinstance(equipment, LabEquipment):
            self.equipment_id = equipment.id
        elif isinstance(equipment, LabEquipmentProvision):
            self.equipment_id = equipment.equipment_id
            self.equipment_provision_id = equipment.id
        else:
            raise ValueError("Expected an equipment or purchase request")

        super().__init__(**kwargs)
