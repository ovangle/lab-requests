from typing import TypeVar

from sqlalchemy.orm import Mapped

from db.models.base import Base
from db.models.user import User
from ..provisionable.provisionable import Provisionable


class Allocatable(Provisionable, Base):
    __abstract__ = True

    allocation_type: Mapped[str]
