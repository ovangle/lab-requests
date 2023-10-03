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
    url: HttpUrl

    orig_filename: str
    filename: str
    content_type: str

    size: int = 0

class FileStoreConfig(TypedDict):
    # The path from the file store root (see settings) to the current file.
    # must be a relative path and exist in the file system.
    path: Path | str
    chunk_size: NotRequired[int]

async def _read_chunked(file: UploadFile, chunk_size: int) -> AsyncIterator[bytes]:
    while True:
        chunk = await file.read(chunk_size)
        yield chunk

class FileStore:
    """
    An abstract file store.
    """
    config: FileStoreConfig

    def __init__(self, config: FileStoreConfig):
        self.config = config

    @cached_property
    def path(self):
        from filestore import filestore_settings
        root_path = filestore_settings.dynamic_file_root

        path = Path(self.config['path'])
        if path.is_absolute():
            raise ValueError('Configured path must be expressed relative to {root_path!s}')
        
        path = root_path / path
        if not path.exists():
            raise IOError('Configured file store path must exist in filesystem')
        return path

    @property
    def chunk_size(self):
        return self.config.get('chunk_size', -1)

    async def save(self, upload_file: UploadFile, use_filename: str | None = None) -> StoredFile:
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
            url=self.file_url(upload_file),
            orig_filename=upload_file.filename,
            filename=filename,
            content_type=upload_file.content_type or 'text/plain',
        )

    async def save_many(self, files: list[UploadFile]) -> list[StoredFile]:
        raise NotImplementedError

    def file_url(self, upload_file: UploadFile):
        raise NotImplementedError
    