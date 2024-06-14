from abc import abstractmethod
from typing import TYPE_CHECKING, Awaitable
from uuid import UUID

from sqlalchemy.orm import Mapped, validates

from db.models.base import Base
from db.models.base.fields import uuid_pk

if TYPE_CHECKING:
    from .lab_installation import LabInstallation
    from .lab_installation_provision import LabInstallationProvision


class Installable(Base):
    __abstract__ = True

    id: Mapped[uuid_pk]
    installation_type: Mapped[str]

    @abstractmethod
    def installations(self) -> Awaitable[list[LabInstallation]]:
        pass

    @validates("installation_type")
    def validate_installation_type(self, value, key):
        if self.installation_type:
            raise ValueError("type cannot be modified after initialization")
        return value
