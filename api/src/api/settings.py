from pydantic_settings import BaseSettings


class ApiSettings(BaseSettings):
    api_page_size_default: int = 20

    api_auth_secret_key: str = "abcdef12345"
    api_auth_access_token_expire_minutes: int = 30


api_settings = ApiSettings()
