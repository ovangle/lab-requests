from __future__ import annotations

from abc import abstractmethod
from typing import Any, Awaitable, ClassVar, Generic, TypeVar
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, validates, mapped_column, relationship

from db.models.fields import uuid_pk
from db.models.base import Base
from db.models.lab.lab import Lab
from db.models.lab.provisionable.provisionable import Provisionable
from db.models.lab.allocatable import Allocatable

from .installation_type import is_installation_type
from .installable import Installable


TInstallable = TypeVar("TInstallable", bound=Installable)


class LabInstallation(Allocatable, Base, Generic[TInstallable]):
    __tablename__ = "lab_installation"
    __installation_type__: ClassVar[str]

    def __init_subclass__(cls, **kw: Any) -> None:
        if not hasattr(cls, "__installation_type__"):
            raise TypeError("LabInstallation subclass has no __installation_type__")
        if not is_installation_type(cls.__installation_type__):
            raise ValueError("LabInstalltion type must be a valid installation type")

        return super().__init_subclass__(**kw)

    id: Mapped[uuid_pk] = mapped_column()
    type: Mapped[str] = mapped_column()
    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    @validates("type")
    def validate_type(self, value, key):
        if self.type:
            raise ValueError("type cannot be modified after initialization")
        return value

    def __init__(self, **kwargs):
        self.type = self.__installation_type__
        return super().__init__(**kwargs)

    @property
    @abstractmethod
    def installable_id(self) -> UUID:
        raise NotImplementedError

    @property
    @abstractmethod
    def installable(self) -> Awaitable[TInstallable]:
        raise NotImplementedError
