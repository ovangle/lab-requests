

from pathlib import Path
from pydantic import HttpUrl
from pydantic_settings import BaseSettings

class FilestoreSettings(BaseSettings):
    root: Path = Path('/srv/files') 
    filesrv_url: HttpUrl = HttpUrl('http://localhost:6767')

    chunk_size: int = -1

filestore_settings = FilestoreSettings()