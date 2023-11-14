
from uuid import UUID
from fastapi import HTTPException

class UserDoesNotExist(HTTPException):
    @classmethod
    def for_id(cls, id: UUID):
        return cls(404, f'No user exists with id {id}')

    @classmethod
    def for_email(cls, email: str):
        return cls(404, f'No user exists with email {email}')


class InvalidCredentials(HTTPException):
    @classmethod
    def login_failed(cls):
        return cls(401, 'Login failed')

    @classmethod
    def token_error(cls):
        return cls(401, 'Invalid credentials')

    @classmethod
    def user_inactive(cls, email: str):
        return cls(401, f'User {email} is currently inactive')