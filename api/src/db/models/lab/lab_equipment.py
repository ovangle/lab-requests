from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4
import uuid

from sqlalchemy import Column, ForeignKey, Table, insert, not_, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import LocalSession
from ..base import Base, DoesNotExist, ModelException
from ..base.fields import uuid_pk, action_timestamp, action_user_fk

if TYPE_CHECKING:
    from db.models.research.funding import ResearchFunding
    from db.models.user import User
    from .lab import Lab


class LabEquipmentDoesNotExist(DoesNotExist):
    def __init__(self, *, for_id: UUID | None):
        super().__init__(for_id=for_id)


class LabEquipmentInstallationDoesNotExist(DoesNotExist):
    def __init__(
        self,
        *,
        for_id: UUID | None = None,
        current_for_equipment_lab: tuple[LabEquipment, Lab] | None = None,
        pending_for_equipment_lab: tuple[LabEquipment, Lab] | None = None,
    ):
        if current_for_equipment_lab:
            equipment, lab = current_for_equipment_lab
            msg = f"No current installation for equipment {equipment.id}, lab {lab.id}"
        if pending_for_equipment_lab:
            equipment, lab = pending_for_equipment_lab
            msg = f"No pending installation for equipment {equipment.id}, lab {lab.id}"
        return super().__init__(msg, for_id=for_id)


class LabEquipmentInstallationExists(ModelException):
    def __init__(
        self, equipment: LabEquipment, lab: Lab, existing_status: ProvisionStatus
    ):
        super().__init__(
            f"An {existing_status} installation already exists for equipment {equipment.id} in {lab.id}"
        )


class LabEquipmentProvisionDoesNotExist(DoesNotExist):
    def __init__(
        self,
        *,
        for_id: UUID | None = None,
        for_equipment_lab: tuple[LabEquipment, Lab] | None = None,
    ):
        if for_equipment_lab:
            equipment, lab = for_equipment_lab
            msg = f"Not found for equipment {equipment.id} and lab {lab.id}"

        super().__init__(msg, for_id=for_id)


class LabEquipmentProvisionInProgress(ModelException):
    def __init__(self, equipment: LabEquipment, lab: Lab):
        self.equipment = equipment
        self.lab = lab
        super().__init__(
            f"An active provision already exists for {equipment.id} in {lab.id}"
        )


class LabEquipmentProvisioningError(ModelException):
    pass


class ProvisionStatus(Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    PURCHASED = "purchased"
    INSTALLED = "installed"
    CANCELLED = "cancelled"


class LabEquipment(Base):
    __tablename__ = "lab_equipment"

    id: Mapped[uuid_pk]

    name: Mapped[str] = mapped_column(postgresql.VARCHAR(128), index=True)
    description: Mapped[str] = mapped_column(postgresql.TEXT, default="")

    tags: Mapped[list[str]] = mapped_column(
        postgresql.ARRAY(postgresql.TEXT), server_default="{}"
    )

    training_descriptions: Mapped[list[str]] = mapped_column(
        postgresql.ARRAY(postgresql.TEXT), server_default="{}"
    )

    installations: Mapped[list[LabEquipmentInstallation]] = relationship(
        back_populates="equipment"
    )

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        e = await db.get(LabEquipment, id)
        if e is None:
            raise LabEquipmentDoesNotExist(for_id=id)
        return e


class LabEquipmentInstallation(Base):
    __tablename__ = "lab_equipment_installation"

    id: Mapped[uuid_pk]

    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("lab_equipment.id"))
    equipment: Mapped[LabEquipment] = relationship()

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    current_install_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("lab_equipment_installation.id"), default=None
    )
    current_install: Mapped[LabEquipmentInstallation | None] = relationship()

    num_installed: Mapped[int] = mapped_column(postgresql.INTEGER, default=1)

    provision_status: Mapped[ProvisionStatus] = mapped_column(
        postgresql.ENUM(ProvisionStatus)
    )
    last_provisioned_at: Mapped[action_timestamp]

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        install = await db.get(cls, id)
        if install is None:
            raise LabEquipmentInstallationDoesNotExist(for_id=id)
        return install

    @classmethod
    async def get_current_for_equipment_lab(
        cls, db: LocalSession, equipment: LabEquipment, lab: Lab
    ):
        install = await db.scalar(
            select(cls).where(
                cls.equipment_id == equipment.id,
                cls.lab_id == lab.id,
                cls.provision_status == "installed",
            )
        )
        if install is None:
            raise LabEquipmentInstallationDoesNotExist(
                current_for_equipment_lab=(equipment, lab)
            )
        return install

    @classmethod
    async def get_pending_for_equipment_lab(
        cls, db: LocalSession, equipment: LabEquipment, lab: Lab
    ):
        install = await db.scalar(
            select(cls).where(
                cls.equipment_id == equipment.id,
                cls.lab_id == lab.id,
                cls.provision_status != "installed",
            )
        )
        if install is None:
            raise LabEquipmentInstallationDoesNotExist(
                pending_for_equipment_lab=(equipment, lab)
            )
        return install

    def update_installation(self, provision: LabEquipmentProvision):
        if provision.is_final:
            raise LabEquipmentProvisioningError(
                "Cannot upgrade installation. Provision not final"
            )
        self.last_provisioned_at = provision.installed_at

    def __init__(
        self,
        current_install: LabEquipmentInstallation | None = None,
        *,
        id: UUID | None = None,
        equipment: LabEquipment | None = None,
        lab: Lab | None = None,
        provision_status: ProvisionStatus,
        num_installed: int,
    ):
        if current_install:
            if not current_install.is_complete:
                raise ValueError("Current install must be a completed install")
            equipment_id = current_install.equipment_id
            lab_id = current_install.lab_id
        else:
            if not equipment:
                raise ValueError("Equipment must be provided for new install")
            equipment_id = equipment.id
            if not lab:
                raise ValueError("Lab must be provided for new install")
            lab_id = lab.id

        super().__init__(
            id=id,
            equipment_id=equipment_id,
            lab_id=lab_id,
            current_install_id=current_install.id if current_install else None,
            num_installed=num_installed,
            provision_status=provision_status,
        )

    @property
    def is_pending(self):
        return self.provision_status != ProvisionStatus.INSTALLED

    @property
    def is_complete(self):
        return self.provision_status == ProvisionStatus.INSTALLED


class LabEquipmentProvision(Base):
    """
    A request to purchase lab equipment for a specific lab
    """

    __tablename__ = "lab_equipment_provision"

    id: Mapped[uuid_pk]

    status: Mapped[ProvisionStatus] = mapped_column(
        postgresql.ENUM(ProvisionStatus, name="equipment_provision_status"),
        default=ProvisionStatus.REQUESTED,
    )
    reason: Mapped[str] = mapped_column(postgresql.TEXT, server_default="")

    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("lab_equipment.id"))
    equipment: Mapped[LabEquipment] = relationship()

    installation_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("lab_equipment_installation.id"),
    )
    installation: Mapped[LabEquipmentInstallation] = relationship()

    lab_id: Mapped[UUID | None] = mapped_column(ForeignKey("lab.id"), default=None)
    lab: Mapped[Lab | None] = relationship()
    funding_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("research_funding.id"), default=None
    )
    funding: Mapped[ResearchFunding | None] = relationship()

    estimated_cost: Mapped[float | None] = mapped_column(postgresql.FLOAT)
    actual_cost: Mapped[float | None] = mapped_column(
        postgresql.FLOAT, server_default=None
    )
    quantity_required: Mapped[int] = mapped_column(postgresql.INTEGER, default=1)
    purchase_url: Mapped[str] = mapped_column(postgresql.VARCHAR(1024), default=None)

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
        equipment_or_install: LabEquipment | LabEquipmentInstallation,
        estimated_cost: float | None,
        quantity_required: int = 1,
        funding: ResearchFunding | None = None,
        reason: str = "",
        purchase_url: str,
        status: ProvisionStatus = ProvisionStatus.REQUESTED,
    ):
        if isinstance(equipment_or_install, LabEquipmentInstallation):
            self.equipment_id = equipment_or_install.equipment_id
            self.installation_id = equipment_or_install.id
            self.lab_id = equipment_or_install.lab_id
        else:
            self.equipment_id = equipment_or_install.id
            self.installation_id = self.lab_id = None

        self.reason = reason
        self.estimated_cost = estimated_cost
        self.quantity_required = quantity_required
        self.purchase_url = purchase_url
        self.status = status
        super().__init__()

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        model = await db.get(cls, id)
        if not model:
            raise LabEquipmentProvisionDoesNotExist(for_id=id)
        return model

    @classmethod
    async def get_active_for_equipment_lab(
        cls, db: LocalSession, equipment: LabEquipment, lab: Lab
    ):
        active_provision = await db.scalar(
            select(cls).where(
                cls.equipment_id == equipment.id,
                cls.lab_id == lab.id,
                not_(cls.status.in_(["installed", "cancelled"])),
            )
        )
        if active_provision is None:
            raise LabEquipmentProvisionDoesNotExist(for_equipment_lab=(equipment, lab))
        return active_provision

    @property
    def is_new_installation(self):
        return self.installation_id is None

    @property
    def is_final(self):
        return self.status == ProvisionStatus.INSTALLED

    def mark_approved(self, approved_by: User):
        if self.status != ProvisionStatus.REQUESTED:
            raise LabEquipmentProvisioningError("provision must be requested")
        self.status = ProvisionStatus.APPROVED
        self.approved_by_id = approved_by.id
        self.approved_at = datetime.now()

    def mark_purchased(self, purchased_by: User, actual_cost: float):
        if self.status != ProvisionStatus.APPROVED:
            raise LabEquipmentProvisioningError("provision must be approved")
        self.status = ProvisionStatus.PURCHASED
        self.actual_cost = actual_cost
        self.purchased_by_id = purchased_by.id
        self.purchased_at = datetime.now()

    def mark_installed(self, installed_by: User):
        if self.status != ProvisionStatus.PURCHASED:
            raise LabEquipmentProvisioningError("provision must be purchased")
        self.status = ProvisionStatus.INSTALLED
        self.installed_by_id = installed_by.id
        self.installed_at = datetime.now()


async def request_provision(
    db: LocalSession,
    equipment: LabEquipment,
    lab: Lab | None,
    quantity_required: int = 1,
    funding: ResearchFunding | None = None,
    estimated_cost: float | None = None,
    reason: str = "",
    purchase_url: str = "",
) -> LabEquipmentProvision:
    if lab:
        equipment_or_install: LabEquipment | LabEquipmentInstallation
        try:
            current_install = (
                await LabEquipmentInstallation.get_current_for_equipment_lab(
                    db, equipment, lab
                )
            )
        except DoesNotExist:
            current_install = None

        try:
            await LabEquipmentProvision.get_active_for_equipment_lab(db, equipment, lab)
            raise LabEquipmentProvisionInProgress(equipment, lab)
        except LabEquipmentProvisionDoesNotExist:
            pass

        current_num_installed = current_install.num_installed if current_install else 0

        pending_install = LabEquipmentInstallation(
            current_install,
            id=uuid4(),
            equipment=equipment,
            lab=lab,
            provision_status=ProvisionStatus.REQUESTED,
            num_installed=current_num_installed + quantity_required,
        )
        db.add(pending_install)

        equipment_or_install = pending_install
    else:
        equipment_or_install = equipment

    provision = LabEquipmentProvision(
        equipment_or_install=equipment_or_install,
        quantity_required=quantity_required,
        reason=reason,
        funding=funding,
        estimated_cost=estimated_cost,
        purchase_url=purchase_url,
    )
    db.add(provision)
    await db.commit()
    return provision


async def create_known_install(
    db: LocalSession, equipment: LabEquipment, lab: Lab, num_installed: int
) -> LabEquipmentProvision:
    any_exists = await db.scalars(
        select(LabEquipmentInstallation).where(
            LabEquipmentInstallation.lab_id == lab.id,
            LabEquipmentInstallation.equipment_id == equipment.id,
        )
    )
    if any_exists.first() is not None:
        existing_install = any_exists.first()
        assert existing_install is not None
        # Can not import an installation over an existing provision or installation.

        raise LabEquipmentInstallationExists(
            equipment, lab, existing_install.provision_status
        )

    installation = LabEquipmentInstallation(
        id=uuid4(),
        equipment=equipment,
        lab=lab,
        num_installed=num_installed,
        provision_status=ProvisionStatus.INSTALLED,
    )
    db.add(installation)
    provision = LabEquipmentProvision(
        equipment_or_install=installation,
    )
    await db.commit()
    return provision
