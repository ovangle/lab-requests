from __future__ import annotations
from abc import ABC, abstractmethod
from functools import cached_property
from io import BytesIO
from pathlib import Path
from typing import IO, AsyncIterator, Protocol, TypedDict
from aiofiles import os
import aiofiles
from anyio import AsyncFile


class StoredFileMeta(TypedDict):
    # filesystem path (relative to FILE_STORE_ROOT)
    path: Path

    filename: str
    orig_filename: str

    content_type: str
    size: int

async def _stored_file_meta(
    file: AsyncBinaryIO,
    saved_to: Path
) -> StoredFileMeta:
    if file.filename is None or file.content_type is None:
        raise ValueError('Invalid file. Expected a filename and content_type')

    try:
        stat_result = await os.stat(saved_to)
    except FileExistsError as e:
        # Is not a stored file until the file exists
        print('error saving file: file does not exist')
        raise e

    return {
        'path': saved_to,
        'filename': saved_to.name,
        'orig_filename': file.filename,
        'content_type' : file.content_type,
        'size': stat_result.st_size
    }

class AsyncBinaryIO(Protocol):
    """
    aiofiles.AsyncFile is not a protocol and UploadFile does not adhere to the 
    AsyncFile interface anyway.
    """
    filename: str | None

    @property
    def content_type(self) -> str | None:
        ...

    @property
    def size(self) -> int | None:
        ...

    async def seek(self, offset: int):
        ...

    async def read(self, size: int = -1) -> bytes:
        ...


async def _read_chunked(file: AsyncBinaryIO, size: int = -1) -> AsyncIterator[bytes]:
    while True:
        chunk = await file.read(size)
        yield chunk

class FileStore:
    """
    Filestore, maps to 
    """

    def __init__(self, 
                 path: Path | str, 
                 chunk_size: int = -1):
        from filestore import filestore_settings
        
        path = Path(path)
        if path.is_absolute():
            raise ValueError('Configured path must be expressed relative to {root_path!s}')
        
        self.path = filestore_settings.root / path
        self.chunk_size = chunk_size

    async def store(
        self, 
        file: AsyncBinaryIO, 
        save_to: Path, 
    ) -> StoredFileMeta:
        if file.filename is None or file.content_type is None:
            raise ValueError('Invalid file. Both filename and content_type must be present')

        if save_to.is_absolute():
            raise ValueError(f'Path must be relative to {self.path!s}')

        async with aiofiles.open(save_to, 'wb') as f:
            async for chunk in _read_chunked(file, self.chunk_size):
                await f.write(chunk)

        return await _stored_file_meta(file, save_to)
    
    def close(self):
        pass