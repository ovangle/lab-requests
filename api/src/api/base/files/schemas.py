from __future__ import annotations

from pathlib import Path
from typing import ClassVar, Generic, Type, TypeVar
from uuid import UUID
from fastapi import UploadFile

from pydantic import BaseModel
from db import LocalSession

from api.base.schemas import SCHEMA_CONFIG
from files.store import StoredFileMeta
from .models import StoredFile_


class StoredFile(BaseModel):
    model_config = SCHEMA_CONFIG

    # Path from the root of the 
    path: Path 

    filename: str
    orig_filename: str
    content_type: str

    size: int = 0

    def __init__(self, meta: StoredFileMeta | StoredFile):
        meta = meta.stored_file_meta if isinstance(meta, StoredFile) else meta
        super().__init__(**meta)
    
    @property
    def stored_file_meta(self) -> StoredFileMeta:
        return {
            'path': self.path,
            'content_type': self.content_type,
            'filename': self.filename,
            'orig_filename': self.orig_filename,
            'size': self.size
        }