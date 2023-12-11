
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

    @classmethod
    def for_access_token(cls, token: str):
        detail = f'No user exists with access token {token}'
        return cls(404, detail)

    @classmethod
    def user_inactive(cls, email: str):
        detail = f'User {email} is inactive'
        return cls(404, detail)

class InvalidCredentials(HTTPException):
    @classmethod
    def login_failed(cls, email: str):
        return cls(401, 'Invalid credentials')

    @classmethod
    def token_error(cls):
        return cls(401, 'Invalid credentials')

    @classmethod
    def user_not_found(cls, email: str):
        return cls(401, f'Invalid credentials')


class NotANativeUserError(HTTPException):
    def __init__(self, user):
        super().__init__(401, F"Operation is only valid for native user")
    

class AlterPasswordConflictError(HTTPException):
    def __init__(self, user): 
        super().__init__(409, f"Alter password. Incorrect password for user '${user.email}'")
