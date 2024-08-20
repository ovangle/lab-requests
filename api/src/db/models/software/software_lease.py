from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


from db.models.base import Base
from db.models.lab.allocatable import LabAllocation

from .software_installation import SoftwareInstallation


class SoftwareLease(LabAllocation[SoftwareInstallation]):
    __allocation_type__ = "software_lease"
    __tablename__ = "software_lease"

    installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("software_installation.id")
    )
    installation: Mapped[SoftwareInstallation] = relationship()
