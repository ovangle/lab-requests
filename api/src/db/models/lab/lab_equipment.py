from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Annotated, cast
from uuid import UUID, uuid4
import uuid

from sqlalchemy import (
    Column,
    ForeignKey,
    Table,
    UniqueConstraint,
    insert,
    literal,
    not_,
    select,
    update,
    event,
)
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import LocalSession, local_object_session
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


class LabEquipmentInstallationItemDoesNotExist(DoesNotExist):
    def __init__(
        self,
        *,
        for_id: UUID | None = None,
        for_installation_index: tuple[LabEquipmentInstallation, int] | None = None,
    ):
        if for_id:
            super().__init__(for_id=for_id)
        elif for_installation_index:
            installation, index = for_installation_index
            msg = f"No installation item for installation {installation.id} at index {index}"
            super().__init__(msg)
        else:
            raise ValueError("Either for_id or for_installation_index must be provided")


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
    # Requested to be installed in (potentially any) lab
    REQUESTED = "requested"
    # The equipment has been approved by the lab manager.
    APPROVED = "approved"
    # The equipment has been purchased and is awaiting installation.
    PURCHASED = "purchased"
    # The equipment is installed in the lab
    INSTALLED = "installed"
    # The request for new equipment is no longer active.
    CANCELLED = "cancelled"
    # Previously installed, but replaced by another installation
    REPLACED = "replaced"

    @property
    def is_pending(self):
        return self in [
            ProvisionStatus.REQUESTED,
            ProvisionStatus.APPROVED,
            ProvisionStatus.PURCHASED,
        ]


PENDING_PROVISION_STATUSES: list[ProvisionStatus] = [
    s for s in ProvisionStatus if s.is_pending
]

provision_status = Annotated[
    ProvisionStatus,
    mapped_column(
        postgresql.ENUM(ProvisionStatus, name="provision_status", create_type=False),
        index=True,
    ),
]


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


class LabEquipmentInstallationItem(Base):
    """
    Represents a specific piece of equipment included in an installation
    """

    __tablename__ = "lab_equipment_installation_item"
    __table_args__ = (
        UniqueConstraint(
            "installation_id", "installation_index", name="installation_index_uniq"
        ),
    )

    id: Mapped[uuid_pk]
    installation_id: Mapped[UUID] = mapped_column(
        ForeignKey("lab_equipment_installation.id"), index=True
    )
    installation: Mapped[LabEquipmentInstallation] = relationship()
    installation_index: Mapped[int] = mapped_column(
        postgresql.INTEGER, default=0, index=True
    )

    replaces_item_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("lab_equipment_installation_item.id"), default=None
    )
    replaces_item: Mapped[LabEquipmentInstallationItem | None] = relationship()

    name: Mapped[str] = mapped_column(postgresql.VARCHAR(1024), index=True)
    provision_status: Mapped[provision_status]
    last_provisioned_at: Mapped[action_timestamp]

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        item = await db.get(LabEquipmentInstallationItem, id)
        if item is None:
            raise LabEquipmentInstallationItemDoesNotExist(for_id=id)
        return item

    @classmethod
    async def get_for_installation_index(
        cls, db: LocalSession, installation: LabEquipmentInstallation, index: int
    ):
        item = await db.scalar(
            select(LabEquipmentInstallationItem).where(
                LabEquipmentInstallationItem.installation_id == installation.id,
                LabEquipmentInstallationItem.installation_index == index,
            )
        )
        if item is None:
            raise LabEquipmentInstallationItemDoesNotExist(
                for_installation_index=(installation, index)
            )
        return item

    def __init__(
        self,
        installation: LabEquipmentInstallation,
        installation_index: int,
        *,
        name: str,
        provision_status: ProvisionStatus,
        replaces_item: LabEquipmentInstallationItem | None,
        **kwargs,
    ):
        if installation_index < 0 or installation_index >= installation.num_installed:
            raise IndexError("Installation index out of range for installation")

        super().__init__(
            installation_id=installation.id,
            installation_index=installation_index,
            replaces_item=replaces_item,
            provision_status=provision_status,
            name=name,
            **kwargs,
        )


class LabEquipmentInstallation(Base):
    __tablename__ = "lab_equipment_installation"

    id: Mapped[uuid_pk]

    equipment_id: Mapped[UUID] = mapped_column(ForeignKey("lab_equipment.id"))
    equipment: Mapped[LabEquipment] = relationship()

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    replaces_installation_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("lab_equipment_installation.id"), default=None
    )
    replaces_installation: Mapped[LabEquipmentInstallation | None] = relationship()

    num_installed: Mapped[int] = mapped_column(postgresql.INTEGER, default=1)
    installed_items: Mapped[list[LabEquipmentInstallationItem]] = relationship(
        back_populates="installation",
        order_by=LabEquipmentInstallationItem.installation_index,
    )

    provision_status: Mapped[provision_status]
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
                cls.provision_status == ProvisionStatus.INSTALLED,
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
                cls.provision_status.in_(PENDING_PROVISION_STATUSES),
            )
        )
        if install is None:
            raise LabEquipmentInstallationDoesNotExist(
                pending_for_equipment_lab=(equipment, lab)
            )
        return install

    def __init__(
        self,
        replaces_install: LabEquipmentInstallation | None = None,
        *,
        id: UUID | None = None,
        equipment: LabEquipment | None = None,
        lab: Lab | None = None,
        provision_status: ProvisionStatus = ProvisionStatus.INSTALLED,
        num_installed: int,
    ):
        if replaces_install:
            if not replaces_install.is_complete:
                raise ValueError("Current install must be a completed install")
            equipment_id = replaces_install.equipment_id
            lab_id = replaces_install.lab_id
        else:
            if not equipment:
                raise ValueError("Equipment must be provided for new install")
            equipment_id = equipment.id
            if not lab:
                raise ValueError("Lab must be provided for new install")
            lab_id = lab.id

        if provision_status != ProvisionStatus.INSTALLED and not replaces_install:
            raise ValueError(
                "A current installation must exist in order to create a pending revision"
            )

        super().__init__(
            id=id,
            equipment_id=equipment_id,
            lab_id=lab_id,
            replaces_installation_id=replaces_install.id if replaces_install else None,
            num_installed=num_installed,
            provision_status=provision_status,
        )

    @property
    def is_pending(self):
        return self.provision_status != ProvisionStatus.INSTALLED

    @property
    def is_complete(self):
        return self.provision_status == ProvisionStatus.INSTALLED

    @property
    def is_replaced(self):
        return self.provision_status == ProvisionStatus.REPLACED

    async def _set_installed_item_nocommit(
        self,
        db: LocalSession,
        at_index: int,
        name: str,
        **kwargs,
    ):
        if self.replaces_installation_id:
            replaces_item = await db.scalar(
                select(LabEquipmentInstallationItem).where(
                    LabEquipmentInstallationItem.installation_id
                    == self.replaces_installation_id,
                    LabEquipmentInstallationItem.installation_index == at_index,
                )
            )
        else:
            replaces_item = None
        item = LabEquipmentInstallationItem(
            self,
            at_index,
            id=uuid4(),
            name=name,
            replaces_item=replaces_item,
            provision_status=self.provision_status,
            **kwargs,
        )
        db.add(item)
        return item

    async def set_installed_item(self, at_index: int, name: str, **kwargs):
        db = local_object_session(self)
        item = await self._set_installed_item_nocommit(db, at_index, name, **kwargs)
        await db.commit()
        return item

    async def set_installed_items(self, item_kwargs: list[tuple[str, dict]]):
        db = local_object_session(self)

        items = [
            await self._set_installed_item_nocommit(db, index, name, **kwargs)
            for index, (name, kwargs) in enumerate(item_kwargs)
        ]

        await db.commit()
        return items


@event.listens_for(LabEquipmentInstallation, "after_insert")
def add_replaced_item_provisions(mapper, connection, target: LabEquipmentInstallation):
    if target.replaces_installation_id:
        # If we are replacing an existing provision, we start as REQUESTED
        assert target.provision_status == ProvisionStatus.REQUESTED

        replaces_id = target.replaces_installation_id
        replace_items = select(
            LabEquipmentInstallationItem.installation_index,
            LabEquipmentInstallationItem.id.label("replaces_item_id"),
            LabEquipmentInstallationItem.name,
            literal(target.id).label("installation_id"),
            literal(target.provision_status).label("provision_status"),
            literal(target.last_provisioned_at).label("last_provisioned_at"),
        ).where(LabEquipmentInstallationItem.installation_id == replaces_id)

        connection.execute(
            insert(LabEquipmentInstallationItem).from_select(
                [
                    "installation_index",
                    "replaces_item_id",
                    "name",
                    "installation_id",
                    "provision_status",
                    "last_provisioned_at",
                ],
                replace_items,
            )
        )


@event.listens_for(LabEquipmentInstallation, "after_update")
def update_item_provision_statuses(
    mapper, connection, target: LabEquipmentInstallation
):
    connection.execute(
        update(LabEquipmentInstallationItem)
        .where(LabEquipmentInstallationItem.installation_id == target.id)
        .values(
            provision_status=target.provision_status,
            last_provisioned_at=datetime.now(tz=timezone.utc),
        )
    )


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
    approved_note: Mapped[str] = mapped_column(postgresql.TEXT, server_default="")

    purchased_at: Mapped[action_timestamp]
    purchased_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("user.id"))
    purchased_by: Mapped[User | None] = relationship(foreign_keys=[purchased_by_id])
    purchased_note: Mapped[str] = mapped_column(postgresql.TEXT, server_default="")

    installed_at: Mapped[action_timestamp]
    installed_by_id: Mapped[UUID | None] = mapped_column(ForeignKey("user.id"))
    installed_by: Mapped[User | None] = relationship(foreign_keys=[installed_by_id])
    installed_note: Mapped[str] = mapped_column(postgresql.TEXT, server_default="")

    def __init__(
        self,
        *,
        equipment_or_install: LabEquipment | LabEquipmentInstallation,
        quantity_required: int = 1,
        funding: ResearchFunding | None = None,
        estimated_cost: float | None = None,
        reason: str = "",
        purchase_url: str,
        status: ProvisionStatus = ProvisionStatus.REQUESTED,
    ):
        if status == ProvisionStatus.INSTALLED:
            if not isinstance(equipment_or_install, LabEquipmentInstallation):
                raise ValueError("Must provide an installation")
            if funding is not None:
                raise ValueError(
                    "Funding is not applicable to an already installed equipment"
                )
            self.installed_note = reason

        if isinstance(equipment_or_install, LabEquipmentInstallation):
            if equipment_or_install.provision_status != status:
                raise ValueError("Installation must have same provision status")

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
                cls.status.in_(PENDING_PROVISION_STATUSES),
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

    async def mark_approved(
        self,
        *,
        approved_by: User,
        approved_note: str,
        lab: Lab | None = None,
        funding: ResearchFunding | None = None,
        estimated_cost: float | None = None,
    ):
        db = local_object_session(self)
        if self.status != ProvisionStatus.REQUESTED:
            raise LabEquipmentProvisioningError("provision must be requested")

        equipment = await self.awaitable_attrs.equipment
        if self.lab_id is None and lab is None:
            raise LabEquipmentProvisioningError(
                "lab must be provided on approval if not already set"
            )
        lab = cast(
            Lab,
            (await self.awaitable_attrs.lab) if self.lab_id is not None else lab,
        )

        try:
            current_installation = (
                await LabEquipmentInstallation.get_current_for_equipment_lab(
                    db, equipment, lab
                )
            )
        except DoesNotExist:
            current_installation = LabEquipmentInstallation(
                id=uuid4(),
                equipment=equipment,
                lab=lab,
                num_installed=0,
                provision_status=ProvisionStatus.INSTALLED,
            )
            db.add(current_installation)

        try:
            pending_installation = (
                await LabEquipmentInstallation.get_pending_for_equipment_lab(
                    db, equipment, lab
                )
            )
            if self.lab_id is None:
                raise LabEquipmentProvisioningError(
                    "Provision already in progress for lab {lab.id}"
                )
            assert self.installation_id == pending_installation.id
            pending_installation.provision_status = ProvisionStatus.APPROVED
        except DoesNotExist:
            num_pending = current_installation.num_installed + self.quantity_required
            pending_installation = LabEquipmentInstallation(
                current_installation,
                id=uuid4(),
                provision_status=ProvisionStatus.APPROVED,
                num_installed=num_pending,
            )
        db.add(pending_installation)

        self.lab_id = lab.id
        self.installation_id = pending_installation.id

        if self.funding_id is None and funding is None:
            raise LabEquipmentProvisioningError(
                "funding must be provided on approval if not already provided"
            )

        self.funding_id = self.funding_id or (cast(ResearchFunding, funding).id)

        if self.estimated_cost is None and estimated_cost is None:
            raise LabEquipmentProvisioningError(
                "a cost estimate must be provided on approval if not already provided"
            )
        self.estimated_cost = self.estimated_cost or estimated_cost

        self.status = ProvisionStatus.APPROVED
        self.approved_by_id = approved_by.id
        self.approved_at = datetime.now()
        self.approved_note = approved_note
        db.add(self)
        await db.commit()

    async def mark_purchased(
        self,
        *,
        purchased_by: User,
        purchased_note: str,
        actual_cost: float,
    ):
        if self.status != ProvisionStatus.APPROVED:
            raise LabEquipmentProvisioningError("provision must be approved")
        db = local_object_session(self)

        if self.installation_id is None:
            raise LabEquipmentProvisioningError(
                "No pending installation for approved provision"
            )

        pending_installation = cast(
            LabEquipmentInstallation, await self.awaitable_attrs.installation
        )
        pending_installation.provision_status = ProvisionStatus.APPROVED
        db.add(pending_installation)

        self.status = ProvisionStatus.PURCHASED
        self.actual_cost = actual_cost
        self.purchased_by_id = purchased_by.id
        self.purchased_at = datetime.now()
        self.purchased_note = purchased_note

        db.add(self)
        await db.commit()

    async def mark_installed(
        self,
        *,
        installed_by: User,
        installed_note: str,
    ):
        db = local_object_session(self)

        if self.status != ProvisionStatus.PURCHASED:
            raise LabEquipmentProvisioningError("provision must be purchased")

        if self.installation_id is None:
            raise LabEquipmentProvisioningError(
                "No pending install for purchased provision"
            )

        pending_installation = cast(
            LabEquipmentInstallation, await self.awaitable_attrs.installation
        )
        pending_installation.provision_status = ProvisionStatus.INSTALLED
        db.add(pending_installation)

        current_installation = cast(
            LabEquipmentInstallation,
            await pending_installation.awaitable_attrs.current_install,
        )
        current_installation.provision_status = ProvisionStatus.REPLACED
        db.add(current_installation)

        self.status = ProvisionStatus.INSTALLED
        self.installed_by_id = installed_by.id
        self.installed_at = datetime.now()
        self.installed_note = installed_note

        await db.commit()


async def create_new_provision(
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
            current_install = LabEquipmentInstallation(
                equipment=equipment, lab=lab, num_installed=0
            )
            db.add(current_install)

        try:
            await LabEquipmentProvision.get_active_for_equipment_lab(db, equipment, lab)
            raise LabEquipmentProvisionInProgress(equipment, lab)
        except LabEquipmentProvisionDoesNotExist:
            pass

        current_num_installed = current_install.num_installed

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
    existing = await db.scalar(
        select(LabEquipmentInstallation).where(
            LabEquipmentInstallation.lab_id == lab.id,
            LabEquipmentInstallation.equipment_id == equipment.id,
        )
    )
    if existing is not None:
        # Can not import an installation over an existing provision or installation.
        raise LabEquipmentInstallationExists(equipment, lab, existing.provision_status)

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
        estimated_cost=0,
        purchase_url="",
    )
    db.add(provision)
    await db.commit()
    return provision
