from __future__ import annotations

from datetime import datetime
from enum import Enum

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.models.base.fields import uuid_pk, action_user_fk, action_timestamp

from ..base import Base, DoesNotExist, ModelException

if TYPE_CHECKING:
    from db.models.user import User
    from .lab import Lab


class LabSoftwareDoesNotExist(DoesNotExist):
    def __init__(self, *, for_id: UUID | None):
        super().__init__(for_id=for_id)


class LabSoftwareProvisioningError(ModelException):
    pass


class LabSoftware(Base):
    __tablename__ = "lab_software"

    id: Mapped[uuid_pk]

    name: Mapped[str] = mapped_column(postgresql.VARCHAR(128))
    description: Mapped[str] = mapped_column(postgresql.TEXT, default="")

    tags: Mapped[list[str]] = mapped_column(
        postgresql.ARRAY(postgresql.TEXT), server_default="{}"
    )

    url: Mapped[str] = mapped_column(postgresql.VARCHAR(1024), default="")

    last_installed_at: Mapped[datetime | None] = mapped_column(
        postgresql.TIME(timezone=True), server_default=None
    )

    def request_new_version(self, version: str):
        self.requested_version = version


class LabSoftwareInstallation(Base):
    __tablename__ = "lab_software_installation"
    id: Mapped[uuid_pk]

    software_id: Mapped[UUID] = mapped_column(ForeignKey("lab_software.id"))
    software: Mapped[LabSoftware] = relationship()

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    version: Mapped[str] = mapped_column(postgresql.VARCHAR(32))
    last_provisioned_at: Mapped[datetime | None] = mapped_column(
        postgresql.TIME(timezone=True), server_default=None
    )

    def update_installation(self, provision: LabSoftwareProvision):
        if provision.is_final:
            raise LabSoftwareProvisioningError(
                "Cannot upgrade installation. Provision not final"
            )
        self.version = provision.request_version
        self.last_provisioned_at = provision.installed_at


class LabSoftwareProvisioningStatus(Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    PURCHASED = "purchased"
    INSTALLED = "installed"


class LabSoftwareProvision(Base):
    __tablename__ = "lab_software_provision"
    id: Mapped[uuid_pk]
    status: Mapped[LabSoftwareProvisioningStatus] = mapped_column(
        postgresql.ENUM(
            LabSoftwareProvisioningStatus, name="software_provision_status"
        ),
        default=LabSoftwareProvisioningStatus.REQUESTED,
    )

    software_id: Mapped[UUID] = mapped_column(ForeignKey("lab_software.id"))
    software: Mapped[LabSoftware] = relationship()

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    # The existing installation, if one exists.
    installation_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("lab_software_installation.id")
    )
    installation: Mapped[LabSoftwareInstallation | None] = relationship()

    request_version: Mapped[str] = mapped_column(postgresql.VARCHAR(64))
    estimated_cost: Mapped[float | None] = mapped_column(
        postgresql.FLOAT, server_default=None
    )
    actual_cost: Mapped[float | None] = mapped_column(
        postgresql.FLOAT, server_default=None
    )

    approved_at: Mapped[action_timestamp]
    approved_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("user.id"))
    approved_by: Mapped[User | None] = relationship(foreign_keys=[approved_by_id])

    purchased_at: Mapped[action_timestamp]
    purchased_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("user.id"))
    purchased_by: Mapped[User | None] = relationship(foreign_keys=[purchased_by_id])

    installed_at: Mapped[action_timestamp]

    installed_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("user.id"))
    installed_by: Mapped[User | None] = relationship(foreign_keys=[installed_by_id])

    def __init__(
        self,
        *,
        software_or_installation: LabSoftware | LabSoftwareInstallation,
        lab: Lab | None = None,
        estimated_cost: float | None,
        request_version: str,
    ):
        if isinstance(software_or_installation, LabSoftwareInstallation):
            self.software_id = software_or_installation.software_id
            self.installation_id = software_or_installation.id
            if lab and not lab.id == software_or_installation.lab_id:
                raise ValueError("Lab must be same as existing installation")
            self.lab_id = software_or_installation.lab_id
        else:
            self.sofware_id = software_or_installation.id
            if not lab:
                raise ValueError("Lab must be provided for new installation")
            self.lab_id = lab.id

        self.estimated_cost = estimated_cost
        self.request_version = request_version
        super().__init__()

    @property
    def is_new_installation(self):
        return self.installation_id is None

    @property
    def is_final(self):
        return self.status == LabSoftwareProvisioningStatus.INSTALLED

    def mark_approved(self, approved_by: User):
        if self.status != LabSoftwareProvisioningStatus.REQUESTED:
            raise LabSoftwareProvisioningError("provision must be 'requested'")
        self.status = LabSoftwareProvisioningStatus.APPROVED
        self.approved_by_id = approved_by.id
        self.approved_at = datetime.now()

    def mark_purchased(self, purchased_by: User, actual_cost: float):
        if self.status != LabSoftwareProvisioningStatus.APPROVED:
            raise LabSoftwareProvisioningError("request must be 'accepted'")
        self.status = LabSoftwareProvisioningStatus.PURCHASED
        self.actual_cost = actual_cost
        self.purchased_by_id = purchased_by.id
        self.purchased_at = datetime.now()

    def mark_installed(self, installed_by: User):
        if self.status != LabSoftwareProvisioningStatus.INSTALLED:
            raise LabSoftwareProvisioningError("provision must be purchased")
        self.status = LabSoftwareProvisioningStatus.INSTALLED
        self.installed_by_id = installed_by.id
        self.installed_at = datetime.now()
