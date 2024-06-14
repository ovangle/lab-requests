from abc import abstractmethod
from typing import TYPE_CHECKING, Awaitable, Self
from uuid import UUID
from sqlalchemy.orm import Mapped

from db import LocalSession
from db.models.base import Base
from db.models.user import User
from db.models.base.fields import uuid_pk

if TYPE_CHECKING:
    from .lab_provision import LabProvision


class Provisionable(Base):
    __abstract__ = True

    id: Mapped[uuid_pk]

    provisions: Mapped[list[LabProvision]]

    @abstractmethod
    def complete_provision(
        self,
        provision: LabProvision,
        *,
        by: User | UUID,
        note: str,
        using: LocalSession | None = None,
        **kwargs
    ) -> Awaitable[Self]:
        ...
