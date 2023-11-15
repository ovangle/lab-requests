
from uuid import UUID
from fastapi import HTTPException

from .types import UserDomain

class UserDoesNotExist(HTTPException):
    @classmethod
    def for_id(cls, id: UUID, domain: UserDomain | None = None):
        detail = f'No user exists with id {id}'
        if domain:
            detail += f' in domain {domain!s}'
        return cls(404, detail)

    @classmethod
    def for_email(cls, email: str, domain: UserDomain | None = None):
        detail = f'No user exists with email {email}'
        if domain:
            detail += f' in domain {domain}'
        return cls(404, detail)


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