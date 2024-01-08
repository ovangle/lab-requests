from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, security

from db import get_db
from db.models.user import NativeUserCredentials, User, UserDoesNotExist, UserDomain

from api.auth.context import get_current_authenticated_user
from .schemas import CurrentUserResponse, AlterPasswordRequest, UserResponse

users = APIRouter(prefix="/users", tags=["users"])


@users.get("/me")
async def me(
    user: Annotated[User, Depends(get_current_authenticated_user)],
) -> CurrentUserResponse:
    return await CurrentUserResponse.from_model(user)


@users.get("/{id}")
async def get_user(id: UUID, db=Depends(get_db)) -> UserResponse:
    try:
        user = await User.get_for_id(db, id)
    except UserDoesNotExist as e:
        raise HTTPException(404, detail=str(e))

    return await UserResponse.from_model(user)


@users.post("/alter-password")
async def alter_password(
    alter_password: AlterPasswordRequest,
    user=Depends(get_current_authenticated_user),
    db=Depends(get_db),
) -> UserResponse:
    if user.domain != UserDomain.NATIVE:
        raise HTTPException(401, detail="Not a native user")
    credentials: NativeUserCredentials = await user.awaitable_attrs.credentials

    if not credentials.verify_password(alter_password.current_value):
        raise HTTPException(409, "Incorrect current password for user")

    credentials.set_password(alter_password.new_value)
    db.add(credentials)
    await db.commit()
    return await UserResponse.from_model(user)
