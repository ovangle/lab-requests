from __future__ import annotations

from abc import abstractmethod
from typing import TYPE_CHECKING, Awaitable
from uuid import UUID

from sqlalchemy.orm import Mapped, validates

from db.models.base import Base

if TYPE_CHECKING:
    from .lab_installation import LabInstallation
    from .lab_installation_provision import LabInstallationProvision


class Installable(Base):
    __abstract__ = True

    installation_type: Mapped[str]

    @abstractmethod
    def installations(self) -> Awaitable[list[LabInstallation]]:
        pass

    @validates("installation_type")
    def validate_installation_type(self, value, key):
        if self.installation_type:
            raise ValueError("type cannot be modified after initialization")
        return value
