from __future__ import annotations
from typing import TYPE_CHECKING, TypeVar
from uuid import UUID

from sqlalchemy import Column, ForeignKey, Select, Table, UniqueConstraint, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import LocalSession, local_object_session
from db.models.base import Base
from db.models.base.base import model_id
from db.models.base.errors import DoesNotExist, ModelException
from db.models.fields import uuid_pk

from .disposal_strategy import DisposalStrategy
from .disposable import Disposable, get_disposable

if TYPE_CHECKING:
    from ..lab import Lab


class LabDisposal(Base):
    """
    Represents a method for disposing of disposables from the lab
    """
    __tablename__ = "lab_disposal"

    id: Mapped[uuid_pk] = mapped_column()

    strategy_id: Mapped[UUID] = mapped_column(ForeignKey("disposal_strategy.id"))
    strategy: Mapped[DisposalStrategy] = relationship()

    lab_id: Mapped[UUID] = mapped_column(ForeignKey("lab.id"))
    lab: Mapped[Lab] = relationship(back_populates='disposals')

    @classmethod
    def select_for_lab_disposable(cls, lab: Lab | UUID, disposable: Disposable) -> Select[tuple[LabDisposal]]:
        allowed_strategies = disposable.select_available_disposal_strategies(lab)

        return select(LabDisposal).where(
            LabDisposal.strategy_id.in_(allowed_strategies.scalar_subquery())
        )

    def __init__(self, strategy: DisposalStrategy | UUID, disposable: Disposable | UUID, amount: float, disposable_type: str | None = None):
        self.strategy_id = model_id(strategy)

        if isinstance(disposable, UUID):
            if disposable_type is None:
                raise ValueError('Disposable type must be provided with disposable id')
            self.disposable_type = disposable_type
            self.disposable_id = disposable
        else:
            if disposable_type is not None:
                assert type(disposable).__tablename__ == disposable_type
            self.disposable_type = type(disposable).__tablename__
            self.disposable_id = model_id(disposable)
        self.amount = amount
        super().__init__()

    async def get_disposable(self):
        db = local_object_session(self)
        return await get_disposable(db, self.disposable_type, self.disposable_id)

def query_lab_disposals(
    lab: Lab | UUID | None = None,
    strategy: DisposalStrategy | UUID | None = None
) -> Select[tuple[LabDisposal]]:
    where_clauses: list = []

    if lab:
        where_clauses.append(LabDisposal.lab_id == model_id(lab))

    if strategy:
        where_clauses.append(LabDisposal.strategy_id == model_id(strategy))

    return select(LabDisposal).where(*where_clauses)