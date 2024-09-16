from __future__ import annotations

from abc import abstractmethod
from typing import TYPE_CHECKING, Awaitable, Self
from uuid import UUID

from sqlalchemy.orm import Mapped, validates

from db.models.base import Base
from db.models.lab.lab import Lab

if TYPE_CHECKING:
    from .lab_installation import LabInstallation


class Installable(Base):
    __abstract__ = True

    @abstractmethod
    async def get_installation(self, lab: Lab | UUID) -> LabInstallation[Self]:
        raise NotImplementedError
