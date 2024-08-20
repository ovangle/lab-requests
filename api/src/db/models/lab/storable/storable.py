from sqlalchemy.orm import Mapped, mapped_column

from db.models.base import Base

from .storage_type import StorageType, STORAGE_TYPE_ENUM


class Storable(Base):
    __abstract__ = True

    storage_type: Mapped[StorageType] = mapped_column(
        STORAGE_TYPE_ENUM, default=StorageType.STANDARD
    )
