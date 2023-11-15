from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, security

from db import get_db

from .schemas import User, UserLoginRequest
from . import model_fns

users = APIRouter(
    prefix='/users',
    tags=['users']
)

@users.get('/{id}')
async def get_user(id: UUID, db = Depends(get_db)) -> User:
    return await User.get_for_id(db, id)

@users.get('/me')
async def get_current_active_user(
    token = Depends(model_fns.oauth2_scheme),
    db = Depends(get_db)
) -> User:
    return await model_fns.get_current_active_user(db, token)

@users.post('/login')
async def login_user(request: UserLoginRequest, db = Depends(get_db)) -> User:
    return await model_fns.login_user(db, request)
