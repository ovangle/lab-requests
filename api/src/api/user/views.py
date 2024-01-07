from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, security

from db import get_db

from .schemas import AlterPasswordRequest, User, UserLoginRequest

users = APIRouter(prefix="/users", tags=["users"])


@users.get("/me")
async def me(
    user=Depends(model_fns.get_current_active_user),
) -> User:
    return user


@users.get("/{id}")
async def get_user(id: UUID, db=Depends(get_db)) -> User:
    return await User.get_for_id(db, id)


@users.post("/alter-password")
async def alter_password(
    alter_password: AlterPasswordRequest,
    user=Depends(model_fns.get_current_active_user),
    db=Depends(get_db),
) -> User:
    return await alter_password(db, user)
