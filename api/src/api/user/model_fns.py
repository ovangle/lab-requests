from typing import Annotated, overload
from uuid import UUID

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from db import LocalSession
from . import models 
from . import schemas

from .errors import UserDoesNotExist, InvalidCredentials

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token')

async def get_user_for_id(db: LocalSession, id: UUID):
    return await schemas.User.get_for_id(db, id)

async def get_user_for_email(db: LocalSession, email: str):
    return await schemas.User.get_for_email(db, email)

# async def alter_password(db: LocalSession, request: schemas.AlterPasswordRequest):
#     user = await login_native_user(NativeLoginUserRequest(
#         request.email,
#         request.old_password
#     ))

#     user.set_password(request.password)
#     db.add(user)
#     return user

async def fake_decode_token(db: LocalSession, token) -> schemas.User:
    return await schemas.User.get_for_id(db, UUID(hex=token))

async def get_current_user(
    db: LocalSession,
    token: Annotated[str, Depends(oauth2_scheme)],
):
    user = await fake_decode_token(db, token)
    if not user:
        raise UserDoesNotExist.for_access_token(token)
    return user


async def get_current_active_user(
    db: LocalSession,
    current_user: Annotated[schemas.User, Depends(get_current_user)]
):
    if current_user.disabled:
        raise UserDoesNotExist.user_inactive(current_user.email)
    return current_user


async def login_native_user(db: LocalSession, email: str, password: str) -> schemas.User:
    try:
        user = await models.NativeUser.get_for_email(db, email)
    except UserDoesNotExist:
        raise InvalidCredentials.user_not_found(email)

    if not user.verify_password(password):
        raise InvalidCredentials.login_failed(email)

    return await schemas.User.from_model(user)

            