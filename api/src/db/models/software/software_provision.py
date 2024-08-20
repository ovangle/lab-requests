from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.models.fields import uuid_pk
from db.models.lab.installable import LabInstallationProvision
from .software import Software
from .software_installation import SoftwareInstallation


class SoftwareProvision(LabInstallationProvision[SoftwareInstallation]):
    __abstract__ = True

    id: Mapped[uuid_pk] = mapped_column()

    software_id: Mapped[UUID] = mapped_column(ForeignKey("software.id"))
    software: Mapped[Software] = relationship()

    installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("software_installation.id"),
    )
    installation: Mapped[SoftwareInstallation] = relationship()
    version: Mapped[str] = mapped_column(postgresql.VARCHAR(32), default="any")


class NewSoftware(SoftwareProvision):
    __provision_type__ = "new_software"
    __tablename__ = "software_provision__new_software"


class UpgradeSoftware(SoftwareProvision):
    __provision_type__ = "upgrade_software"
    __tablename__ = "software_provision__upgrade_software"
