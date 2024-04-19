from http import HTTPStatus
from typing import Annotated, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, security
from api.uni.schemas import lookup_campus

from db import LocalSession, get_db
from db.models.uni.discipline import Discipline
from db.models.user import (
    NativeUserCredentials,
    TemporaryAccessToken,
    User,
    UserDoesNotExist,
    UserDomain,
)

from api.auth.context import get_current_authenticated_user
from .schemas.user import (
    AlterPasswordRequest,
    UserIndex,
    UserView,
)
from .schemas.current_user import CurrentUserView
from .schemas.temporary_access_user import (
    CreateTemporaryUserRequest,
    CreateTemporaryUserResponse,
    FinalizeTemporaryUserRequest,
    TemporaryUserView,
)
from .queries import query_users


users = APIRouter(prefix="/users", tags=["users"])


@users.get("/")
async def index_users(
    search: Optional[str] = None,
    include_roles: Optional[str] = None,
    discipline: Optional[Discipline] = None,
    db=Depends(get_db),
):
    if include_roles:
        include_role_set = set(include_roles.split(","))
    else:
        include_role_set = None
    index = UserIndex(
        query_users(
            search=search, include_roles=include_role_set, discipline=discipline
        )
    )
    return await index.load_page(db, 1)


@users.get("/me")
async def me(
    user: Annotated[User, Depends(get_current_authenticated_user)],
) -> CurrentUserView:
    return await CurrentUserView.from_model(user)


@users.get("/{id}")
async def get_user(id: UUID, db=Depends(get_db)) -> UserView:
    try:
        user = await User.get_for_id(db, id)
    except UserDoesNotExist as e:
        raise HTTPException(404, detail=str(e))

    return await UserView.from_model(user)


@users.post("/alter-password")
async def alter_password(
    alter_password: AlterPasswordRequest,
    user=Depends(get_current_authenticated_user),
    db=Depends(get_db),
) -> UserView:
    if user.domain != UserDomain.NATIVE:
        raise HTTPException(401, detail="Not a native user")
    credentials: NativeUserCredentials = await user.awaitable_attrs.credentials

    if not credentials.verify_password(alter_password.current_value):
        raise HTTPException(409, "Incorrect current password for user")

    credentials.set_password(alter_password.new_value)
    db.add(credentials)
    await db.commit()
    return await UserView.from_model(user)


@users.post("/create-temporary-user")
async def create_temporary_user(
    request: CreateTemporaryUserRequest,
    user=Depends(get_current_authenticated_user),
    db=Depends(get_db),
) -> CreateTemporaryUserResponse:
    user = await request.do_create(db)
    return await CreateTemporaryUserResponse.from_model(user)


@users.get("/finalize-temporary-user/{id}")
async def prepare_finalize_temporary_user(
    id: UUID, token: str, db=Depends(get_db)
) -> TemporaryUserView:
    user = await User.get_for_id(db, id)
    if not await user.get_temporary_access_token(token):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, "Invalid access token")

    return await TemporaryUserView.from_model(user, token=token)


@users.post("/finalize-temporary-user")
async def finalize_temporary_user(
    request: FinalizeTemporaryUserRequest, db: LocalSession = Depends(get_db)
) -> UserView:
    user = await User.get_for_id(db, request.id)
    temporary_access = await user.get_temporary_access_token(request.token)

    if not temporary_access or temporary_access.is_expired:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, "Invalid or expired access token")

    if temporary_access.is_consumed:
        raise HTTPException(HTTPStatus.CONFLICT, detail="credentials already used")

    await temporary_access.create_native_credentials(password=request.password)
    await db.commit()
    await db.refresh(user)
    return await UserView.from_model(user)
