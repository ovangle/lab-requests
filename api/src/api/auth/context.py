from abc import abstractmethod
from datetime import timedelta
from typing import Annotated, TypeVar

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from db import LocalSession, get_db

from db.models.base.base import Base
from db.models.user import User, UserDoesNotExist, UserDomain, NativeUserCredentials

from api.schemas.base_schemas import ModelRequest
from .schemas import Token, parse_user_email_from_token, invalid_credentials_error

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


async def login_native_user(
    db: LocalSession,
    username: str,
    password: str,
    *,
    expires_in: timedelta | None = None,
) -> Token:
    try:
        user = await User.get_for_email(db, username)
    except UserDoesNotExist:
        raise invalid_credentials_error()

    if user.domain != UserDomain.NATIVE:
        raise invalid_credentials_error()

    is_valid_password = any(
        credentials.verify_password(password)
        for credentials in await user.awaitable_attrs.credentials
        if isinstance(credentials, NativeUserCredentials)
    )
    if not is_valid_password:
        raise invalid_credentials_error()

    return Token.create(user, expires_in=expires_in)


async def get_current_authenticated_user(
    db: Annotated[LocalSession, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    user_email = parse_user_email_from_token(token)

    try:
        user = await User.get_for_email(db, user_email)
    except UserDoesNotExist:
        raise invalid_credentials_error()

    if user.disabled:
        raise invalid_credentials_error()

    return user
