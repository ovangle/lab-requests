from pathlib import Path
from pydantic import HttpUrl
from pydantic_settings import BaseSettings


class FilestoreSettings(BaseSettings):
    chunk_size: int = -1

    filestore_provider: str = "LOCAL"

    filestore_key: str = "/home/ovangle/dev/cqu-site/.files"
    filestore_secret: str | None = None
    filestore_api_version: str | None = None
    filestore_region: str | None = None
