from __future__ import annotations
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects import postgresql

from db import LocalSession
from db.models.base import Base
from db.models.lab.disposable.disposal_strategy import DisposalStrategy
from db.models.lab.lab import Lab

from .storage_strategy import LabStorageStrategy

_storable_types: dict[str, type[Base]] = {}

async def get_storable(db: LocalSession, type: str, id: UUID) -> Storable:
    if type not in _storable_types:
        raise TypeError(f'Unrecognised storable type {type}')
    py_type = _storable_types[type]

    result = await py_type.get_by_id(db, id)
    assert isinstance(result, Storable)
    return result

class Storable(Base):
    __abstract__ = True

    def __init_subclass__(cls, **kw):
        if not cls.__abstract__:
            if cls.__tablename__ in _storable_types:
                raise TypeError('Type already registered as a storable type')
            _storable_types[cls.__tablename__] = cls
        super().__init_subclass__(**kw)

    # the storable can be stored using any of the following strategies.
    # stored as list, since we cannot define a many-to-many relationship on a base class.
    allowed_storage_strategy_names: Mapped[list[str]] = mapped_column(
        postgresql.ARRAY(postgresql.VARCHAR(64)),
        server_default="{}"
    )

    def select_available_disposal_strategies(self, lab: Lab | UUID) -> Select[tuple[LabStorageStrategy]]:
        lab_supported_strategy_ids = LabStorageStrategy.select_allowed_for_lab(lab).scalar_subquery()

        return select(LabStorageStrategy).where(
            LabStorageStrategy.id.in_(lab_supported_strategy_ids),
            LabStorageStrategy.name.in_(self.allowed_storage_strategy_names)
        )
