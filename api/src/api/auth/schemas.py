from datetime import datetime, timedelta, tzinfo
from typing import Annotated, Optional
from fastapi import Depends
from pydantic import BaseModel

from jose import jwt

from api.user.schemas import User
from db import LocalSession, get_db
from .constants import ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from .errors import InvalidCredentials


class Token(BaseModel):
    token_type: str
    access_token: str
    expires_in: int
    refresh_token: str | None = None

def create_access_token(
    user: User, 
    expires_in: Optional[timedelta] = None, 
    refreshable: bool = False
) -> Token:
    expires_in = expires_in or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expires_at = datetime.utcnow() + expires_in

    token_data = {
        "sub": user.email,
        "exp": expires_at
    }

    if refreshable:
        raise NotImplementedError('Refreshable tokens')

    return Token(
        token_type='Bearer', 
        access_token=jwt.encode(token_data, SECRET_KEY, ALGORITHM),
        expires_in=int(expires_in.total_seconds())
    )

def parse_user_email_from_token(
    access_token: str
):
    payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
    email = payload.get('sub')
    if email is None:
        raise InvalidCredentials.malformed_token(access_token)
    return email
    
