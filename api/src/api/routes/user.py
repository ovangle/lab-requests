from http import HTTPStatus
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException

from api.auth.context import get_current_authenticated_user
from api.schemas.user.current_user import CurrentUserDetail
from api.schemas.user.temporary_access_user import (
    CreateTemporaryUserRequest,
    CreateTemporaryUserResponse,
    FinalizeTemporaryUserRequest,
    TemporaryUserDetail,
)
from db import LocalSession, get_db
from db.models.uni.discipline import Discipline
from db.models.user import (
    NativeUserCredentials,
    User,
    UserDoesNotExist,
    UserDomain,
    query_users,
)

from api.schemas.user import UserDetail, UserIndexPage, AlterPasswordRequest



users = APIRouter(prefix="/users", tags=["users"])


@users.get("/")
async def index_users(
    id_in: str | None = None,
    search: str | None = None,
    include_roles: str | None = None,
    discipline: str | None = None,
    supervises_lab: UUID | None = None,
    page_index: int = 1,
    db=Depends(get_db),
):

    if id_in:
        id_set = [UUID(v) for v in id_in.split(',')]
    else:
        id_set = None

    if discipline:
        discipline_set = set(Discipline(v) for v in discipline.split(','))
    else:
        discipline_set = None

    if include_roles:
        include_role_set = set(include_roles.split(","))
    else:
        include_role_set = None

    selection = query_users(
            id_in=id_set,
            search=search,
            include_roles=include_role_set,
            discipline=discipline_set,
            supervises_lab=supervises_lab,
        )
    return await UserIndexPage.from_selection(
        db,
        selection,
        page_index=page_index
    )


@users.get("/me")
async def me(
    user: Annotated[User, Depends(get_current_authenticated_user)],
) -> CurrentUserDetail:
    return await CurrentUserDetail.from_model(user)


@users.post("/me/alter-password")
async def alter_password(
    alter_password: AlterPasswordRequest,
    user=Depends(get_current_authenticated_user),
    db=Depends(get_db),
) -> UserDetail:
    if user.domain != UserDomain.NATIVE:
        raise HTTPException(401, detail="Not a native user")
    credentials: NativeUserCredentials = await user.awaitable_attrs.credentials

    if not credentials.verify_password(alter_password.current_value):
        raise HTTPException(409, "Incorrect current password for user")

    credentials.set_password(alter_password.new_value)
    db.add(credentials)
    await db.commit()
    return await UserDetail.from_model(user)


@users.get("/user/{id}")
async def get_user(id: UUID, db=Depends(get_db)) -> UserDetail:
    try:
        user = await User.get_for_id(db, id)
    except UserDoesNotExist as e:
        raise HTTPException(404, detail=str(e))

    return await UserDetail.from_model(user)


@users.post("/create-temporary-user")
async def create_temporary_user(
    request: CreateTemporaryUserRequest,
    user=Depends(get_current_authenticated_user),
    db=Depends(get_db),
) -> CreateTemporaryUserResponse:
    user = await request.do_create(db=db)
    return await CreateTemporaryUserResponse.from_model(user)


@users.get("/finalize-temporary-user/{id}")
async def prepare_finalize_temporary_user(
    id: UUID, token: str, db=Depends(get_db)
) -> TemporaryUserDetail:
    user = await User.get_for_id(db, id)
    if not await user.get_temporary_access_token(token):
        raise HTTPException(HTTPStatus.UNAUTHORIZED, "Invalid access token")

    return await TemporaryUserDetail.from_model(user)


@users.post("/finalize-temporary-user")
async def finalize_temporary_user(
    request: FinalizeTemporaryUserRequest, db=Depends(get_db)
) -> UserDetail:
    user = await User.get_for_id(db, request.id)
    temporary_access = await user.get_temporary_access_token(request.token)

    if not temporary_access or temporary_access.is_expired:
        raise HTTPException(HTTPStatus.UNAUTHORIZED, "Invalid or expired access token")

    if temporary_access.is_consumed:
        raise HTTPException(HTTPStatus.CONFLICT, detail="credentials already used")

    await temporary_access.create_native_credentials(password=request.password)
    await db.commit()
    await db.refresh(user)
    return await UserDetail.from_model(user)
