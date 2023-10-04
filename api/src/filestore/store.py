from __future__ import annotations
from abc import ABC, abstractmethod
from functools import cached_property
from pathlib import Path
from typing import AsyncIterator, ClassVar, NotRequired, Optional, TypedDict
import aiofiles

from fastapi import HTTPException, UploadFile
from pydantic import HttpUrl, BaseModel, ValidationError

class StoredFile(BaseModel):
    # Path from the root of the 
    path: Path 

    orig_filename: str
    filename: str
    content_type: str

    size: int = 0

    def __init__(self, file: UploadFile, path: Path):
        if not file.filename:
            raise ValueError('UploadFile has no filename')
        if not file.content_type:
            raise ValueError('UploadFile has no content_type')
        if file.size is None:
            raise ValueError('UploadFile has no size')
        super().__init__(
            path=path,
            orig_filename=file.filename,
            filename=path.name,
            size=file.size
        )

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

    async def store(self, upload_file: UploadFile, *, use_filepath: Path | str | None = None) -> StoredFile:
        if not upload_file.filename:
            raise ValidationError('file must be named')

        if use_filepath:
            path = self.path / use_filepath
            filepath=use_filepath
        else:
            path = self.path / upload_file.filename
            filepath=upload_file.filename

        async with aiofiles.open(path, 'wb') as f:
            async for chunk in _read_chunked(upload_file, self.chunk_size):
                await f.write(chunk)

        return StoredFile(upload_file, path)
            
    async def store_multiple(self, files: list[UploadFile]) -> list[StoredFile]:
        raise NotImplementedError
    
    def close(self):
        pass