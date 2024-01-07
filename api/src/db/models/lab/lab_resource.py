from __future__ import annotations

from uuid import UUID
from typing import TYPE_CHECKING, Annotated, ClassVar
from sqlalchemy import ForeignKey
from sqlalchemy.dialects import postgresql

from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base, DoesNotExist

from db.models.base.fields import uuid_pk

if TYPE_CHECKING:
    from ..lab import Lab


class LabResourceDoesNotExist(DoesNotExist):
    pass


class LabResource(Base):
    __tablename__ = "lab_resource"
    __mapper_args__ = {
        "polymorphic_identity": "lab_resource",
        "polymorphic_on": "type",
    }
    __lab_resource_type__: ClassVar[str]

    @classmethod
    def __init_subclass__(cls):
        r_type = cls.__mapper_args__["polymorphic_identity"]
        if not isinstance(r_type, str) or len(r_type) > 16:
            raise TypeError("LabResource subclass has no declared type")
        setattr(cls, "__lab_resource_type__", r_type)

        return super().__init_subclass__()

    id: Mapped[uuid_pk]
    type: Mapped[str] = mapped_column(postgresql.VARCHAR(16), index=True)

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    def __init__(self, **kwargs):
        self.type = type(self).__lab_resource_type__
        super().__init__(**kwargs)


lab_resource_pk = Annotated[
    UUID, mapped_column(ForeignKey("lab_resource.id"), primary_key=True)
]
