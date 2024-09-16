from pydantic_settings import BaseSettings


class ApiSettings(BaseSettings):
    debug_port: int = 8765

    api_page_size_default: int = 20

    api_auth_secret_key: str = "abcdef12345"
    api_auth_access_token_expire_minutes: int = 86400

    user_temporary_access_token_expire_minutes: int = 86400


api_settings = ApiSettings()
