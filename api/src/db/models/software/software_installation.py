from uuid import UUID
from sqlalchemy import ForeignKey, Select, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql

from db import LocalSession
from db.models.base import model_id
from db.models.fields import uuid_pk

from db.models.lab import Lab
from db.models.lab.installable import LabInstallation, LabInstallationProvision
from db.models.lab.provisionable.lab_provision import ProvisionType, ProvisionStatus
from db.models.user import User
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

def query_software_installations(
    lab: Lab | UUID | None = None,
    software: Software | UUID | None = None,
) -> Select[tuple[SoftwareInstallation]]:
    where_clauses: list = []
    if lab is not None:
        where_clauses.append(
            SoftwareInstallation.lab_id == model_id(lab)
        )

    if software is not None:
        where_clauses.append(
            SoftwareInstallation.software_id == model_id(software)
        )

    return select(SoftwareInstallation).where(*where_clauses)


class SoftwareInstallationProvision(LabInstallationProvision[SoftwareInstallation]):
    __provision_type__ = ProvisionType(
        "software_installation_provision",
        actions={"new_software", "upgrade_software"}
    )
    __tablename__ = "software_installation_provision"

    id: Mapped[uuid_pk] = mapped_column(ForeignKey("lab_provision.id"), primary_key=True)

    software_id: Mapped[UUID] = mapped_column(ForeignKey("software.id"))
    software: Mapped[Software] = relationship()

    installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("software_installation.id"),
    )
    installation: Mapped[SoftwareInstallation] = relationship()
    min_version: Mapped[str] = mapped_column(postgresql.VARCHAR(32), default="any")

    requires_license: Mapped[bool] = mapped_column(postgresql.BOOLEAN, default=False)
    is_paid_software: Mapped[bool] = mapped_column(postgresql.BOOLEAN, default=False)

    @classmethod
    async def new_software(
        cls,
        db: LocalSession,
        installation: SoftwareInstallation,
        *,
        requested_by: User,
        min_version: str = 'any',
        note: str
    ):
        lab = await installation.awaitable_attrs.lab
        provision = cls(
            action="new_software",
            lab=lab,
            installation=installation,
            min_version=min_version,
            requested_by=requested_by,
            note=note,
            software_id=installation.software_id,
        )
        return await cls._create(db, provision)

    @classmethod
    async def upgrade_software(
        cls,
        db: LocalSession,
        installation: SoftwareInstallation,
        *,
        requested_by: User,
        min_version: str,
        note: str
    ):
        lab = await installation.awaitable_attrs.lab
        provision = cls(
            action="upgrade_software",
            lab=lab,
            installation=installation,
            min_version=min_version,
            requested_by=requested_by,
            note=note
        )
        return await cls._create(db, provision)

    @classmethod
    async def _create(cls, db: LocalSession, provision):
        db.add(provision)
        await db.commit()
        return provision

def query_software_installation_provisions(
    installation: SoftwareInstallation | UUID | None = None,
    only_pending: bool=False
) -> Select[tuple[SoftwareInstallationProvision]]:
    where_clauses: list = []
    if installation:
        where_clauses.append(
            SoftwareInstallationProvision.installation_id == model_id(installation)
        )

    if only_pending:
        pending_statuses = [status for status in ProvisionStatus if status.is_pending]
        where_clauses.append(
            SoftwareInstallationProvision.status.in_(pending_statuses)
        )

    return select(SoftwareInstallationProvision).where(*where_clauses)
