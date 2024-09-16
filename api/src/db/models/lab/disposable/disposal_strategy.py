from __future__ import annotations

from enum import Enum
from uuid import UUID

from sqlalchemy import Column, ForeignKey, Select, Table, UniqueConstraint, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import LocalSession
from db.models.base import Base, ModelException, DoesNotExist, model_id
from db.models.fields import uuid_pk

from db.models.lab import Lab


lab_supported_disposal_strategies = Table(
    "lab_supported_disposal_strategies",
    Base.metadata,
    Column("disposal_strategy_id", ForeignKey("disposal_strategy.id"), primary_key=True),
    Column("lab_id", ForeignKey("lab.id"), primary_key=True),
)

class UnsupportedDisposalStrategy(ModelException):
    def __init__(self, lab_id: Lab | UUID, strategy: DisposalStrategy):
        self.lab_id = lab_id
        self.strategy = strategy

        msg = f'Lab {lab_id!s} does not support {strategy!s} disposing of items'
        super().__init__(msg)


class DisposalStrategy(Base):
    __tablename__ = "disposal_strategy"

    id: Mapped[uuid_pk] = mapped_column()
    name: Mapped[str] = mapped_column(postgresql.VARCHAR(64), index=True, unique=True)
    description: Mapped[str] = mapped_column(postgresql.TEXT)

    supported_in_labs: Mapped[list[Lab]] = relationship(
        secondary=lab_supported_disposal_strategies
    )

    @classmethod
    async def get_for_name(cls, db: LocalSession, name: str) -> DisposalStrategy:
        r = await db.scalar(
            select(DisposalStrategy).where(DisposalStrategy.name == name)
        )
        if r is None:
            msg = "No disposal strategy '{name}'"
            raise DoesNotExist('DisposalStrategy')
        return r

    @classmethod
    def select_allowed_for_lab(cls, lab: Lab | UUID) -> Select[tuple[DisposalStrategy]]:
        select_related = select(lab_supported_disposal_strategies.c.disposal_strategy_id).where(
            lab_supported_disposal_strategies.c.lab_id == model_id(lab)
        )

        return select(DisposalStrategy).where(
            DisposalStrategy.id.in_(select_related)
        )
