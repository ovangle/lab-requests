from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .lab_installation import LabInstallation
from ..provisionable.lab_provision import LabProvision

TInstallation = TypeVar("TInstallation", bound=LabInstallation)


class LabInstallationProvision(LabProvision[TInstallation], Generic[TInstallation]):
    """
    Base class for a provision which modifies a lab installation.
    """

    __abstract__ = True
    id: Mapped[UUID] = mapped_column(ForeignKey("lab_provision.id"), primary_key=True)

    installation_id: Mapped[UUID]
    installation: Mapped[TInstallation]
