from typing import Generic, TypeVar

from sqlalchemy.orm import Mapped

from .lab_installation import LabInstallation
from ..provisionable.lab_provision import LabProvision

TInstallation = TypeVar("TInstallation", bound=LabInstallation)


class LabInstallationProvision(LabProvision[TInstallation], Generic[TInstallation]):
    __abstract__ = True
