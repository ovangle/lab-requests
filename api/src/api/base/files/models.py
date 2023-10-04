from pathlib import Path
from typing import ClassVar
from uuid import UUID

from sqlalchemy import VARCHAR, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped

from db.orm import uuid_pk
from ..models import Base

class StoredFile_(Base):
    __abstract__ = True

    path: Mapped[Path] = mapped_column(VARCHAR(1024))
    content_type: Mapped[str] = mapped_column(VARCHAR(64))

    orig_filename: Mapped[str] = mapped_column(VARCHAR(256))
    filename: Mapped[str] = mapped_column(VARCHAR(256))

