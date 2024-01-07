from pydantic_settings import BaseSettings


class ApiSettings(BaseSettings):
    api_page_size_default: int = 20


api_settings = ApiSettings()
