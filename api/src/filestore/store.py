from __future__ import annotations
from abc import ABC, abstractmethod
from functools import cached_property
from pathlib import Path
from typing import AsyncIterator, ClassVar, NotRequired, Optional, TypedDict
import aiofiles

from fastapi import HTTPException, UploadFile
from pydantic import HttpUrl, BaseModel, ValidationError

class StoredFile(BaseModel):
    path: Path 

    orig_filename: str
    filename: str
    content_type: str

    size: int = 0

async def _read_chunked(file: UploadFile, chunk_size: int) -> AsyncIterator[bytes]:
    while True:
        chunk = await file.read(chunk_size)
        yield chunk

class FileStore:
    """
    An abstract file store.
    """

    def __init__(self, 
                 path: Path | str, 
                 chunk_size: int = -1):
        from filestore import filestore_settings
        
        path = Path(path)
        if path.is_absolute():
            raise ValueError('Configured path must be expressed relative to {root_path!s}')
        
        self.path = filestore_settings.dynamic_file_root / path
        self.chunk_size = chunk_size

    async def store(self, upload_file: UploadFile, use_filename: str | None = None) -> StoredFile:
        if not upload_file.filename:
            raise ValidationError('file must be named')

        if use_filename:
            path = self.path / use_filename
            filename=use_filename
        else:
            path = self.path / upload_file.filename
            filename=upload_file.filename

        async with aiofiles.open(path, 'wb') as f:
            async for chunk in _read_chunked(upload_file, self.chunk_size):
                await f.write(chunk)

        return StoredFile(
            path=path, 
            orig_filename=upload_file.filename,
            filename=filename,
            content_type=upload_file.content_type or 'text/plain',
        )

    async def store_multiple(self, files: list[UploadFile]) -> list[StoredFile]:
        raise NotImplementedError
    