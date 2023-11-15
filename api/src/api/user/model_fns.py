from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from db import LocalSession
from . import models 
from . import schemas

from .errors import InvalidCredentials, UserDoesNotExist, InvalidCredentials

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')

async def get_user_for_id(db: LocalSession, id: UUID):
    return await schemas.User.get_for_id(db, id)

async def get_user_for_email(db: LocalSession, email: str):
    return await schemas.User.get_for_email(db, email)

async def _login_native_user(db: LocalSession, login_request: schemas.NativeUserLoginRequest) -> schemas.User:
    try:
        user = await models.NativeUser.get_for_email(db, login_request.email)
    except UserDoesNotExist:
        raise InvalidCredentials.login_failed()
    
    password = login_request.password.get_secret_value()
    if not await user.verify_password(login_request.password.get_secret_value()):
        raise InvalidCredentials.login_failed()

    return await schemas.User.from_model(user)

async def login_user(db: LocalSession, login_request: schemas.UserLoginRequest) -> schemas.User:
    if isinstance(login_request, schemas.NativeUserLoginRequest):
        return await _login_native_user(db, login_request)
    else:
        raise ValueError('Expected a login request')

# async def alter_password(db: LocalSession, request: schemas.AlterPasswordRequest):
#     user = await login_native_user(NativeLoginUserRequest(
#         request.email,
#         request.old_password
#     ))

#     user.set_password(request.password)
#     db.add(user)
#     return user

async def fake_decode_token(db: LocalSession, token):
    token = await models.NativeUser.get_for_id(db, token)

async def get_current_user(
    db: LocalSession,
    token: Annotated[str, Depends(oauth2_scheme)],
):
    user = await fake_decode_token(db, token)
    if not user:
        raise InvalidCredentials.token_error()
    return user

async def get_current_active_user(
    db: LocalSession,
    token: Annotated[str, Depends(oauth2_scheme)]
):
    current_user = await get_current_user(db, token)
    if current_user.disabled:
        raise InvalidCredentials.user_inactive(current_user.id)
    return current_user
