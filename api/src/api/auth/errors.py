from fastapi import HTTPException

class InvalidCredentials(HTTPException):
    @classmethod
    def login_failed(cls):
        return cls(401, 'Invalid credentials')

    @classmethod
    def token_error(cls):
        return cls(401, 'Invalid credentials')

    @classmethod
    def user_not_found(cls, email: str):
        return cls(401, f'Invalid credentials')
