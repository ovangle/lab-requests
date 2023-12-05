from fastapi import HTTPException

class InvalidCredentials(HTTPException):
    @classmethod
    def login_failed(cls):
        return cls(401, 'Invalid credentials')

    @classmethod
    def malformed_token(cls, access_token: str):
        return cls(401, 'Invalid credentials')

    @classmethod
    def user_not_found(cls, email: str):
        return cls(401, f'Invalid credentials')
