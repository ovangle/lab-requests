from __future__ import annotations

from pathlib import Path
from typing import ClassVar
from uuid import UUID

from sqlalchemy import VARCHAR, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from db import LocalSession

from db.orm import uuid_pk
from filestore.store import FileStore, StoredFileMeta
from ..models import Base

class StoredFile_(Base):
    __abstract__ = True

    path: Mapped[Path] = mapped_column(VARCHAR(1024))
    content_type: Mapped[str] = mapped_column(VARCHAR(64))

    orig_filename: Mapped[str] = mapped_column(VARCHAR(256))
    filename: Mapped[str] = mapped_column(VARCHAR(256))

    size: Mapped[int] = mapped_column()

    @property
    def stored_file_meta(self) -> StoredFileMeta:
        return {
            'path': self.path,
            'content_type': self.content_type,
            'filename': self.filename,
            'orig_filename': self.orig_filename,
            'size': self.size
        }