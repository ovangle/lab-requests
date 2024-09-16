from typing import ClassVar, TypeVar

from sqlalchemy.orm import Mapped

from db.models.base import Base
from db.models.user import User
from ..provisionable.provisionable import Provisionable


class Allocatable(Provisionable, Base):
    __abstract__ = True
    __allocation_type__: ClassVar[str]

    @property
    def allocation_type(self):
        return type(self).__allocation_type__