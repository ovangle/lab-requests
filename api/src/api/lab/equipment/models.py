from __future__ import annotations
from typing import Iterable

from uuid import UUID, uuid4
from sqlalchemy import ARRAY, INTEGER, TEXT, VARCHAR, Column, ForeignKey, Table, select
from sqlalchemy.dialects import postgresql as pg_dialect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.base.models import Base
from db import LocalSession
from db.orm import uuid_pk

from ..types import LabType
from .errors import EquipmentDoesNotExist, EquipmentTagDoesNotExist


class EquipmentTag(Base):
    __tablename__ = 'equipment_tags'

    id: Mapped[uuid_pk]
    name: Mapped[str] = mapped_column(VARCHAR(128), unique=True)

    frequency: Mapped[int] = mapped_column(INTEGER, default=0)

    def __init__(self, *, id: UUID | None = None, name: str):
        super().__init__()
        self.id = id or uuid4()
        self.name = name

    @staticmethod
    async def fetch_for_id(db: LocalSession, id: UUID) -> EquipmentTag:
        tag = await db.get(EquipmentTag, id)
        if tag is None:
            raise EquipmentTagDoesNotExist.for_id(id)
        return tag

    @staticmethod
    async def fetch_for_name(db: LocalSession, name: str):
        result = await db.scalar(
            select(EquipmentTag).where(EquipmentTag.name == name.lower())
        )
        if result is None:
            raise EquipmentTagDoesNotExist.for_name(name)
        return result

    @staticmethod
    async def fetch_or_create_for_name(db: LocalSession, name: str):
        try:
            return await EquipmentTag.fetch_for_name(db, name)
        except EquipmentTagDoesNotExist:
            tag = EquipmentTag(name=name)
            db.add(EquipmentTag)
            await db.commit()
            return tag

class Equipment(Base):
    __tablename__ = 'equipments'

    id: Mapped[uuid_pk]

    name: Mapped[str] = mapped_column(VARCHAR(128), unique=True)
    description: Mapped[str] = mapped_column(TEXT, server_default='')

    tags: Mapped[list[str]] = mapped_column(ARRAY(VARCHAR(128)), server_default='{}')
    available_in_lab_types: Mapped[list[LabType]] = mapped_column(
        ARRAY(pg_dialect.ENUM(LabType)), 
        server_default="{}"
    )

    training_descriptions: Mapped[list[str]] = mapped_column(ARRAY(TEXT), server_default="{}")

    @staticmethod
    async def get_for_id(db: AsyncSession, id: UUID) -> Equipment:
        result = (await db.execute(
            select(Equipment).where(Equipment.id == id)
        )).first()
        if not result:
            raise EquipmentDoesNotExist.for_id(id)
        return result[0]

    def __init__(
        self, 
        *, 
        name: str, 
        description: str = '',
        tags: Iterable[str] | None = None,
        training_descriptions: Iterable[str] | None = None
    ):
        self.name = name
        self.description = description
        self.tags = sorted(list(tags or {}))
        self.training_descriptions = list(training_descriptions or [])
