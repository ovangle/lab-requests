from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey, Select, select
from sqlalchemy.orm import Mapped, mapped_column, relationship


from db.models.base import Base, model_id
from db.models.lab.allocatable import LabAllocation
from db.models.lab.allocatable.allocation_consumer import LabAllocationConsumer
from db.models.lab.allocatable.allocation_status import AllocationStatus

from .software_installation import SoftwareInstallation


class SoftwareLease(LabAllocation[SoftwareInstallation]):
    __allocation_type__ = "software_lease"
    __tablename__ = "software_lease"

    id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_allocation.id"), primary_key=True
    )

    installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("software_installation.id")
    )
    installation: Mapped[SoftwareInstallation] = relationship()

    async def get_target(self) -> SoftwareInstallation:
        return await self.awaitable_attrs.installation

def query_software_leases(
    consumer: LabAllocationConsumer | UUID | None = None,
    installation: SoftwareInstallation | UUID | None = None,
    only_pending: bool = False
) -> Select[tuple[SoftwareLease]]:
    where_clauses: list = []

    if consumer:
        where_clauses.append(
            SoftwareLease.consumer_id == model_id(consumer)
        )

    if installation:
        where_clauses.append(
            SoftwareLease.installation_id == model_id(installation)
        )

    if only_pending:
        pending_statuses = [s for s in AllocationStatus if s.is_pending]
        where_clauses.append(SoftwareLease.status.in_(pending_statuses))

    return select(SoftwareLease).where(*where_clauses)
