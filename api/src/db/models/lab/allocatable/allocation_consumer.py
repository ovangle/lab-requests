from __future__ import annotations
from typing import ClassVar

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects import postgresql

from db.models.base import Base
from db.models.fields import uuid_pk

class LabAllocationConsumer(Base):
    __allocation_consumer_type__: ClassVar[str]
    __tablename__ = "lab_allocation_consumer"

    __mapper_args__ = {
        "polymorphic_on": "type"
    }

    type: Mapped[str] = mapped_column(postgresql.VARCHAR(64), index=True)
    id: Mapped[uuid_pk] = mapped_column()

    def __init__(self, **kwargs):
        self.type = type(self).__allocation_consumer_type__
        super().__init__(**kwargs)
