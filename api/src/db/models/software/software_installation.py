from uuid import UUID
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql

from db.models.fields import uuid_pk

from db.models.lab.installable import LabInstallation, LabInstallationProvision
from .software import Software


class SoftwareInstallation(LabInstallation[Software]):
    __installation_type__ = "software"
    __tablename__ = "software_installation"

    id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_installation.id"), primary_key=True
    )
    software_id: Mapped[UUID] = mapped_column(ForeignKey("software.id"), index=True)
    software: Mapped[Software] = relationship()

    installed_version: Mapped[str] = mapped_column(postgresql.VARCHAR(64), index=True)


class SoftwareInstallationProvision(LabInstallationProvision[SoftwareInstallation]):
    __abstract__ = True

    id: Mapped[uuid_pk] = mapped_column()

    software_id: Mapped[UUID] = mapped_column(ForeignKey("software.id"))
    software: Mapped[Software] = relationship()

    installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("software_installation.id"),
    )
    installation: Mapped[SoftwareInstallation] = relationship()
    version: Mapped[str] = mapped_column(postgresql.VARCHAR(32), default="any")


class NewSoftware(SoftwareInstallationProvision):
    __provision_type__ = "new_software"
    __tablename__ = "software_provision__new_software"


class UpgradeSoftware(SoftwareInstallationProvision):
    __provision_type__ = "upgrade_software"
    __tablename__ = "software_provision__upgrade_software"
