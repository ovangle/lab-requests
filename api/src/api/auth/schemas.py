from datetime import datetime, timedelta, tzinfo
from typing import Annotated, Optional
from fastapi import Depends, HTTPException
from pydantic import BaseModel

from jose import JWTError, jwt

from db import LocalSession, get_db
from db.models.user import NativeUserCredentials, User, UserDomain
from ..settings import api_settings

SECRET_KEY = api_settings.api_auth_secret_key
DEFAULT_ACCESS_TOKEN_EXPIRES_IN: timedelta = timedelta(
    minutes=api_settings.api_auth_access_token_expire_minutes
)


def invalid_credentials_error():
    return HTTPException(
        401,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


def parse_user_email_from_token(access_token: str):
    try:
        payload = jwt.decode(access_token, SECRET_KEY)
        email = payload.get("sub")
        if email is None:
            raise invalid_credentials_error()
        return email
    except JWTError as e:
        raise invalid_credentials_error()


class Token(BaseModel):
    token_type: str = "Bearer"
    access_token: str
    expires_in: int
    refresh_token: str | None = None

    @classmethod
    def create(
        cls,
        user: User,
        *,
        expires_in: timedelta | None = None,
        refreshable=False,
    ):
        expires_in = expires_in or DEFAULT_ACCESS_TOKEN_EXPIRES_IN
        expires_at = datetime.utcnow() + expires_in

        token_data = {"sub": user.email, "exp": expires_at}
        if refreshable:
            raise NotImplementedError("refreshable tokens")
        encoded_jwt = jwt.encode(token_data, SECRET_KEY)

        return cls(access_token=encoded_jwt, expires_in=int(expires_in.total_seconds()))
