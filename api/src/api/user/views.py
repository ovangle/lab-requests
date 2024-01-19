from http import HTTPStatus
from typing import Annotated, Optional
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, security
from api.uni.schemas import lookup_campus

from db import get_db
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
async def index_users(search: Optional[str] = None, db=Depends(get_db)):
    index = UserIndex(query_users(search=search))
    return await index.load_page(db, 0)


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
    if "create-temporary-user" not in user.roles:
        raise HTTPException(
            HTTPStatus.UNAUTHORIZED,
            detail="Not a member of the 'create-temporary-user' group",
        )

    campus = await lookup_campus(db, request.base_campus)

    user = User(
        id=uuid4(),
        domain=UserDomain.NATIVE,
        email=request.email,
        name=request.name,
        title="student",
        campus=campus,
        disciplines=[request.discipline],
        roles=["student"],
    )

    credentials = TemporaryAccessToken(user=user)
    db.add_all([user, credentials])
    await db.commit()

    return CreateTemporaryUserResponse(
        token=credentials.token, user=await UserView.from_model(user)
    )


@users.get("/finalize-temporary-user/{email}")
async def prepare_finalize_temporary_user(
    id: UUID, db=Depends(get_db)
) -> TemporaryUserView:
    user = await User.get_for_id(db, id)
    return await TemporaryUserView.from_model(user)


@users.post("/finalize-temporary-user")
async def finalize_temporary_user(
    request: FinalizeTemporaryUserRequest, db=Depends(get_db)
) -> UserView:
    user = await User.get_for_id(db, request.id)
    temporary_access = await user.get_latest_temporary_access_token()
    if temporary_access is None:
        raise HTTPException(HTTPStatus.CONFLICT, detail="no token found for user")

    if temporary_access.is_expired:
        raise HTTPException(HTTPStatus.CONFLICT, detail="credentials expired")

    if temporary_access.is_consumed:
        raise HTTPException(HTTPStatus.CONFLICT, detail="credentials already used")

    await temporary_access.create_native_credentials(password=request.password)
    return await UserView.from_model(user)
