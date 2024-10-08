from __future__ import annotations


from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings

class DbSettings(BaseSettings):
    debug_port: int = 8765

    db_user: str = "api"
    db_password: str = "secret"
    db_host: str = "127.0.0.1"
    db_port: int = 5432
    db_name: str = "api"

    @property
    def db_url(self):
        return (
            "postgresql+psycopg://"
            f"{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )
