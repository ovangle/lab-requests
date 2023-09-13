from typing import Literal
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_debug: Literal['yes', 'no'] = 'no'

    @property
    def is_debug(self):
        return self.api_debug == 'yes'

    db_user: str = 'api'
    db_password: str = 'secret'
    db_host: str = '127.0.0.1'
    db_port: int = 5432
    db_name: str = 'api'

    @property
    def db_url(self):
        return (
            'postgresql+psycopg://'
            f'{self.db_user}:{self.db_password}'
            f'@{self.db_host}:{self.db_port}/{self.db_name}'
        )
