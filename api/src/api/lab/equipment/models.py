from __future__ import annotations

from uuid import UUID
from sqlalchemy import ARRAY, TEXT, VARCHAR, select
from sqlalchemy.dialects import postgresql as pg_dialect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from api.base.models import Base
from api.utils.db import uuid_pk

from ..types import LabType
from .errors import EquipmentDoesNotExist


class Equipment(Base):
    __tablename__ = 'equipments'

    id: Mapped[uuid_pk]

    name: Mapped[str] = mapped_column(VARCHAR(128), unique=True)
    description: Mapped[str] = mapped_column(TEXT, server_default='')

    available_in_lab_types: Mapped[list[LabType]] = mapped_column(
        ARRAY(pg_dialect.ENUM(LabType)), 
        server_default="{}"
    )

    requires_training: Mapped[bool] = mapped_column()
    training_descriptions: Mapped[list[str]] = mapped_column(ARRAY(TEXT), server_default="{}")

    @staticmethod
    async def get_by_id(db: AsyncSession, id: UUID) -> Equipment:
        result = (await db.execute(
            select(Equipment).where(Equipment.id == id)
        )).first()
        if not result:
            raise EquipmentDoesNotExist.for_id(id)
        return result[0]
