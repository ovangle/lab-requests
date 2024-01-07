from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..lab_resource import LabResource, lab_resource_pk

if TYPE_CHECKING:
    from ..lab_software import LabSoftware, LabSoftwareProvision


class SoftwareLease(LabResource):
    """
    Represents a reservation of a piece of software
    to be used by a research plan
    """

    __tablename__ = "lab_resource__software_lease"
    __mapper_args__ = {
        "polymorphic_identity": "software_lease",
    }
    id: Mapped[lab_resource_pk]

    software_id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_software.id"), nullable=True
    )
    software: Mapped[LabSoftware] = relationship()

    software_provision_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("lab_software_provision.id"), nullable=True, server_default=None
    )
    software_provision: Mapped[LabSoftwareProvision] = relationship()

    def __init__(self, *, software: LabSoftware | LabSoftwareProvision, **kwargs):
        if isinstance(software, LabSoftware):
            self.software_id = software.id
        elif isinstance(software, LabSoftwareProvision):
            self.software_id = software.software_id
            self.software_provision_id = software.id
        else:
            raise ValueError("Expected software or a software provision request")
        super().__init__(**kwargs)
