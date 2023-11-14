from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from db import LocalSession
from . import models 
from . import schemas

from .errors import InvalidCredentials, UserDoesNotExist, InvalidCredentials

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')

async def login_native_user(db: LocalSession, login_request: schemas.NativeUserLoginRequest) -> schemas.NativeUser:
    try:
        user = await models.NativeUser.get_for_email(db, login_request.email)
    except UserDoesNotExist:
        raise InvalidCredentials.login_failed()
    
    if not await user.verify_password(login_request.password):
        raise InvalidCredentials.login_failed()

    return await schemas.NativeUser.from_model(user)

async def login_user(db: LocalSession, login_request: schemas.UserLoginRequest) -> schemas.NativeUser:
    if isinstance(login_request, schemas.NativeUserLoginRequest):
        return await login_native_user(db, login_request)
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
