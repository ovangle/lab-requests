from __future__ import annotations
from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql

from db.models.base import Base
from db.models.fields import uuid_pk
from db.models.lab.installable import Installable

if TYPE_CHECKING:
    from .software_installation import SoftwareInstallation


class Software(Installable, Base):
    __tablename__ = "software"
    id: Mapped[uuid_pk] = mapped_column()

    name: Mapped[str] = mapped_column(postgresql.VARCHAR(64), unique=True, index=True)
