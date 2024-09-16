from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey, Select, select
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.models.base import Base, model_id
from db.models.fields import uuid_pk
from db.models.lab.allocatable import LabAllocation
from db.models.lab.allocatable.allocation_status import AllocationStatus
from .equipment_installation import EquipmentInstallation


class EquipmentLease(LabAllocation[EquipmentInstallation]):
    __tablename__ = "equipment_lease"
    __allocation_type__ = "equipment_lease"

    id: Mapped[UUID] = mapped_column(ForeignKey("lab_allocation.id"), primary_key=True)

    installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("equipment_installation.id")
    )
    installation: Mapped[EquipmentInstallation] = relationship()

    async def get_target(self):
        return await self.awaitable_attrs.installation


def query_equipment_leases(
    target: EquipmentInstallation | UUID | None = None,
    only_pending: bool = False
) -> Select[tuple[EquipmentLease]]:
    where_clauses: list = []
    if target:
        where_clauses.append(
            EquipmentLease.installation_id == model_id(target)
        )

    if only_pending:
        pending_statuses = [s for s in AllocationStatus if s.is_pending]
        where_clauses.append(
            EquipmentLease.status.in_(pending_statuses)
        )

    return select(EquipmentLease).where(*where_clauses)