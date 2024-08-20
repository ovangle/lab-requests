from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql

from db.models.base import Base
from db.models.fields import uuid_pk

from ..lab import Lab
from .lab_disposal_type import LabDisposalType, LAB_DISPOSAL_TYPE


class LabDisposal(Base):
    """
    Represents a method of disposing of arbitrary materials
    """

    __tablename__ = "lab_disposal"
    id: Mapped[uuid_pk]

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship()

    type: Mapped[LabDisposalType] = mapped_column(LAB_DISPOSAL_TYPE)

    allocations: Mapped[list[LabDisposalAllocation]] = relationship(
        back_populates="disposal"
    )


class LabDisposalAllocation(Base):
    __tablename__ = "lab_disposal_allocation"

    id: Mapped[uuid_pk]

    disposal_id: Mapped[UUID] = mapped_column(ForeignKey("lab_disposal.id"))
    disposal: Mapped[LabDisposal] = relationship()
