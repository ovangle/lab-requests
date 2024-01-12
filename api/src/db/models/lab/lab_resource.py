from __future__ import annotations
from abc import abstractmethod
from enum import Enum

from uuid import UUID
from typing import TYPE_CHECKING, Annotated, ClassVar
from sqlalchemy import ForeignKey, Select
from sqlalchemy.dialects import postgresql

from sqlalchemy.ext.asyncio import async_object_session
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import LocalSession

from ..base import Base, DoesNotExist

from db.models.base.fields import uuid_pk

if TYPE_CHECKING:
    from ..lab import Lab


class LabResourceDoesNotExist(DoesNotExist):
    pass


class LabResourceType(Enum):
    EQUIPMENT_LEASE = "equipment_lease"
    SOFTWARE_LEASE = "software_lease"
    INPUT_MATERIAL = "input_material"
    OUTPUT_MATERIAL = "output_material"


lab_resource_type = Annotated[
    LabResourceType, mapped_column(postgresql.ENUM(LabResourceType))
]


class LabResource(Base):
    __tablename__ = "lab_resource"
    __mapper_args__ = {
        "polymorphic_identity": "lab_resource",
        "polymorphic_on": "type",
    }
    __lab_resource_type__: ClassVar[LabResourceType]

    @classmethod
    def __init_subclass__(cls):
        r_type = cls.__mapper_args__["polymorphic_identity"]
        if not isinstance(r_type, LabResourceType):
            raise TypeError(
                "LabResource subclass must have a LabResourceType polymorphic_identity"
            )
        setattr(cls, "__lab_resource_type__", r_type)

        return super().__init_subclass__()

    id: Mapped[uuid_pk]
    type: Mapped[lab_resource_type] = mapped_column(index=True)

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    def __init__(self, **kwargs):
        self.type = type(self).__lab_resource_type__
        super().__init__(**kwargs)


lab_resource_pk = Annotated[
    UUID, mapped_column(ForeignKey("lab_resource.id"), primary_key=True)
]
