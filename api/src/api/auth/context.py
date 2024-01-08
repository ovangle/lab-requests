from datetime import timedelta
from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from db import LocalSession, get_db

from db.models.user import User, UserDoesNotExist, UserDomain, NativeUserCredentials

from .schemas import Token, parse_user_email_from_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


def _invalid_credentials():
    return HTTPException(
        401,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


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
        raise _invalid_credentials()

    if user.domain != UserDomain.NATIVE:
        raise _invalid_credentials()

    credentials: NativeUserCredentials = await user.awaitable_attrs.credentials

    if not credentials.verify_password(password):
        raise _invalid_credentials()

    return Token.create(user, expires_in=expires_in)


async def get_current_authenticated_user(
    db: Annotated[LocalSession, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    user_email = parse_user_email_from_token(token)

    try:
        user = await User.get_for_email(db, user_email)
    except UserDoesNotExist:
        raise _invalid_credentials()

    if user.disabled:
        raise _invalid_credentials()

    return user
