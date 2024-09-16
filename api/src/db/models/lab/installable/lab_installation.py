from __future__ import annotations

from abc import abstractmethod
from typing import Any, Awaitable, ClassVar, Generic, Self, TypeVar
from urllib import request
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, validates, mapped_column, relationship, declared_attr
from sqlalchemy.dialects import postgresql
from db import LocalSession

from db.models.base.base import model_id
from db.models.fields import uuid_pk
from db.models.base import Base
from db.models.lab.lab import Lab
from db.models.lab.provisionable.provisionable import Provisionable
from db.models.lab.allocatable import Allocatable
from db.models.research.funding import ResearchFunding
from db.models.user import User

from ..provisionable import LabProvision

from .installation_type import is_installation_type
from .installable import Installable


TInstallable = TypeVar("TInstallable", bound=Installable)


class LabInstallation(Allocatable, Provisionable, Base, Generic[TInstallable]):
    __tablename__ = "lab_installation"
    __table_args__ = (
        UniqueConstraint("lab_id", "installable_id"),
    )
    __installation_type__: ClassVar[str]

    def __init_subclass__(cls, **kw: Any) -> None:
        if not hasattr(cls, "__installation_type__"):
            raise TypeError("LabInstallation subclass has no __installation_type__")
        if not is_installation_type(cls.__installation_type__):
            raise ValueError("LabInstalltion type must be a valid installation type")

        return super().__init_subclass__(**kw)

    id: Mapped[uuid_pk] = mapped_column()
    type: Mapped[str] = mapped_column(postgresql.VARCHAR(64))

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship(Lab)

    # Used for uniqueness guarantees.
    # Extending classes should declare an actual foreign key to the installable table
    installable_id: Mapped[UUID] = mapped_column(postgresql.UUID)

    created_by_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))

    @validates("type")
    def validate_type(self, value, key):
        if self.type:
            raise ValueError("type cannot be modified after initialization")
        return value

    @classmethod
    @abstractmethod
    async def get_for_installable_lab(cls, db: LocalSession, installable: Installable | UUID, lab: Lab | UUID) -> Self:
        ...

    @abstractmethod
    def get_installable(self) -> Awaitable[TInstallable]:
        raise NotImplementedError

    def __init__(
        self,
        lab: Lab | UUID,
        installable: TInstallable | UUID,
        *,
        created_by: User | UUID,
        **kwargs
    ):
        self.id = uuid4()

        self.type = type(self).__installation_type__
        self.lab_id = model_id(lab)
        self.installable_id = model_id(installable)
        self.created_by_id = model_id(created_by)
        super().__init__(**kwargs)


TInstallation = TypeVar("TInstallation", bound=LabInstallation, covariant=True)


class LabInstallationProvision(LabProvision[TInstallation], Generic[TInstallation]):
    """
    Base class for a provision which modifies a lab installation.
    """

    __abstract__ = True
    id: Mapped[UUID] = mapped_column(ForeignKey("lab_provision.id"), primary_key=True)

    installation_id: Mapped[UUID]
    installation: Mapped[TInstallation]

    def __init__(self, action: str, *, lab: Lab, installation: TInstallation, requested_by: User, note: str, funding: ResearchFunding | None = None, estimated_cost: float | None = None, **kwargs):
        super().__init__(action,
            lab=lab,
            funding=funding,
            estimated_cost=estimated_cost,
            requested_by=requested_by,
            note=note,
        )