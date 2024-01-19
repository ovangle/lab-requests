from __future__ import annotations
import asyncio
from datetime import datetime
from http import HTTPStatus
from typing import Set

from typing_extensions import override
from uuid import UUID
from fastapi import HTTPException
from pydantic import BaseModel

from pydantic.types import SecretStr
from sqlalchemy import func, select

from db import LocalSession, local_object_session
from db.models.uni.discipline import Discipline
from db.models.user import TemporaryAccessToken, User, UserDomain


from ...base.schemas import (
    ModelCreateRequest,
    ModelLookup,
    ModelView,
    ModelUpdateRequest,
    ModelIndex,
    ModelIndexPage,
)
from api.uni.schemas import CampusLookup, CampusView


class UserView(ModelView[User]):
    id: UUID
    domain: UserDomain
    email: str
    name: str
    disciplines: set[Discipline]
    base_campus: CampusView

    disabled: bool
    roles: set[str]

    @classmethod
    async def from_model(cls, model: User, **kwargs):
        base_campus = await CampusView.from_model(await model.awaitable_attrs.campus)
        return cls(
            id=model.id,
            domain=model.domain,
            email=model.email,
            name=model.name,
            base_campus=base_campus,
            disciplines=model.disciplines,
            disabled=model.disabled,
            roles=set(model.roles),
            created_at=model.created_at,
            updated_at=model.updated_at,
            **kwargs,
        )


class TemporaryUserView(UserView):
    token_expires_at: datetime
    token_expired: bool

    token_consumed_at: datetime | None
    token_consumed: bool

    @classmethod
    async def from_model(cls, model: User, **kwargs):
        latest_access_token = await model.get_latest_temporary_access_token()
        if latest_access_token is None:
            raise HTTPException(
                HTTPStatus.CONFLICT, detail="User has no temporary access tokens"
            )

        return await super().from_model(
            model,
            token_expires_at=latest_access_token.expires_at,
            token_expired=latest_access_token.is_expired,
            token_consumed_at=latest_access_token.consumed_at,
            token_consumed=latest_access_token.is_consumed,
        )


class UserLookup(ModelLookup[User]):
    id: UUID | None = None
    email: str | None = None
    username: str | None = None

    async def get(self, db: LocalSession):
        if self.id:
            return await User.get_for_id(db, self.id)
        if self.email:
            return await User.get_for_email(db, self.email)
        if self.username:
            return await User.get_for_email(db, self.username)
        raise ValueError("At least one of id, email, username must be provided")


# TODO: PEP 695
UserRef = UserLookup | UUID


async def lookup_user(db: LocalSession, ref: UserRef):
    if isinstance(ref, UUID):
        ref = UserLookup(id=ref)
    return await ref.get(db)


class UserIndex(ModelIndex[UserView, User]):
    __item_view__ = UserView


# TODO: PEP 695
UserIndexPage = ModelIndexPage[UserView, User]


class AlterPasswordRequest(ModelUpdateRequest[User]):
    current_value: str
    new_value: str


class CreateTemporaryUserRequest(ModelCreateRequest[User]):
    email: str
    name: str
    base_campus: CampusLookup | UUID
    discipline: Discipline


class CreateTemporaryUserResponse(BaseModel):
    token: str
    user: UserView


class FinalizeTemporaryUserRequest(ModelUpdateRequest[User]):
    id: UUID
    token: str
    password: str
