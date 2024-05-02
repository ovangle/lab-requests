from __future__ import annotations

from datetime import datetime, date, time, timezone
from typing import TYPE_CHECKING, Unpack
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import LocalSession
from db.models.base.errors import DoesNotExist
from db.models.lab.lab_equipment import LabEquipmentInstallation

from ..lab_resource import (
    LabResource,
    LabResourceAttrs,
    LabResourceType,
    lab_resource_pk,
)

if TYPE_CHECKING:
    from ..lab_equipment import LabEquipment, LabEquipmentProvision


class EquipmentLeaseAttrs(LabResourceAttrs):
    equipment_installation: LabEquipmentInstallation
    equipment_provision: LabEquipmentProvision | None
    start_date: date | None
    end_date: date | None
    equipment_training_completed: set[str]
    require_supervision: bool
    setup_instructions: str


class EquipmentLease(LabResource):
    """
    Represents a reservation of a piece of lab equipment
    required by a research plan
    """

    __tablename__ = "lab_resource__equipment_lease"
    __mapper_args__ = {
        "polymorphic_identity": LabResourceType.EQUIPMENT_LEASE,
    }
    id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_resource.id", name="equipment_lease_resource_fk"),
        primary_key=True,
    )

    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("lab_equipment.id"))
    equipment: Mapped[LabEquipment] = relationship()

    equipment_installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_equipment_installation.id")
    )
    equipment_installation: Mapped[LabEquipmentInstallation] = relationship()

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

    def __init__(self, **attrs: Unpack[EquipmentLeaseAttrs]):
        from ..lab_equipment import LabEquipment, LabEquipmentProvision

        equipment_installation: LabEquipmentInstallation = attrs[
            "equipment_installation"
        ]

        self.equipment_installation_id = equipment_installation.id
        self.equipment_id = equipment_installation.equipment_id

        if equipment_installation.lab_id != attrs["lab"].id:
            raise ValueError("Equipment must have an installation in resource lab")

        equipment_provision: LabEquipmentProvision | None = attrs["equipment_provision"]
        if equipment_provision:
            if equipment_provision.installation_id != equipment_installation.id:
                raise ValueError("Equipment provision must apply to leased equipment")

            self.equipment_provision_id = equipment_provision.id

        if attrs["start_date"] is not None:
            self.start_date = datetime.combine(
                attrs["start_date"], time(0), tzinfo=timezone.utc
            )
        if attrs["end_date"] is not None:
            self.end_date = datetime.combine(
                attrs["end_date"], time(0), tzinfo=timezone.utc
            )

        self.equipment_training_completed = set(attrs["equipment_training_completed"])
        self.require_supervision = bool(attrs["require_supervision"])
        self.setup_instructions = attrs["setup_instructions"]

        return super().__init__(
            lab=attrs["lab"], container=attrs["container"], index=attrs["index"]
        )
