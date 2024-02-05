from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4
import uuid

from sqlalchemy import Column, ForeignKey, Table, insert
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import LocalSession

from ..base import Base, DoesNotExist, ModelException
from ..base.fields import uuid_pk, action_timestamp, action_user_fk

if TYPE_CHECKING:
    from db.models.user import User
    from .lab import Lab


class LabEquipmentDoesNotExist(DoesNotExist):
    def __init__(self, *, for_id: UUID | None):
        super().__init__(for_id=for_id)


class LabEquipmentProvisionDoesNotExist(DoesNotExist):
    pass


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

    num_installed: Mapped[int] = mapped_column(postgresql.INTEGER, default=1)

    provision_status: Mapped[ProvisionStatus] = mapped_column(
        postgresql.ENUM(ProvisionStatus)
    )
    last_provisioned_at: Mapped[action_timestamp]

    def update_installation(self, provision: LabEquipmentProvision):
        if provision.is_final:
            raise LabEquipmentProvisioningError(
                "Cannot upgrade installation. Provision not final"
            )
        self.last_provisioned_at = provision.installed_at


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

    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("lab_equipment.id"))
    equipment: Mapped[LabEquipment] = relationship()

    installation_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("lab_equipment_installation.id"),
    )
    installation: Mapped[LabEquipmentInstallation] = relationship()

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
        lab: Lab | None = None,
        estimated_cost: float | None,
        quantity_required: int = 1,
        purchase_url: str,
    ):
        if isinstance(equipment_or_install, LabEquipmentInstallation):
            self.equipment_id = equipment_or_install.equipment_id
            self.installation_id = equipment_or_install.id
            if lab and not lab.id == equipment_or_install.id:
                raise ValueError("Lab must be same as existing install")
            self.lab_id = equipment_or_install.id
        else:
            self.equipment_id = equipment_or_install.id
            if not lab:
                raise ValueError("Lab must be provied for new install")
            self.lab_id = lab.id

        self.estimated_cost = estimated_cost
        self.quantity_required = quantity_required
        self.purchase_url = purchase_url
        super().__init__()

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        model = await db.get(cls, id)
        if not model:
            raise LabEquipmentProvisionDoesNotExist(for_id=id)
        return model

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
