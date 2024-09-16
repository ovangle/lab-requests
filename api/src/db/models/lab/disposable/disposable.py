from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from db import LocalSession, local_object_session
from db.models.base import Base
from db.models.base.base import model_id

if TYPE_CHECKING:
    from db.models.lab import Lab

from .disposal_strategy import DisposalStrategy


_disposable_types: dict[str, type[Base]] = {}

async def get_disposable(db: LocalSession, type: str, id: UUID):
    if type not in _disposable_types:
        raise TypeError(f'unrecognised disposable type {type}')
    py_type = _disposable_types[type]
    return await py_type.get_by_id(db, id)

class Disposable(Base):
    __abstract__ = True

    def __init_subclass__(cls, **kw):
        if not cls.__abstract__:
            if cls.__tablename__ in _disposable_types:
                raise TypeError('Class already registered in disposable types')
            _disposable_types[cls.__tablename__] = cls

        super().__init_subclass__(**kw)

    # The disposable can be disposed of via any of the following methods
    allowed_disposal_strategy_names: Mapped[list[str]] = mapped_column(
        postgresql.VARCHAR(64),
        server_default="{}"
    )

    def select_available_disposal_strategies(self, lab: Lab | UUID) -> Select[tuple[DisposalStrategy]]:
        """
        The subset of the disposal strategies that are available in the given lab.
        """

        lab_supported_strategy_ids = DisposalStrategy.select_allowed_for_lab(lab).scalar_subquery()

        return select(DisposalStrategy).where(
            DisposalStrategy.id.in_(lab_supported_strategy_ids),
            DisposalStrategy.name.in_(self.allowed_disposal_strategy_names)
        )