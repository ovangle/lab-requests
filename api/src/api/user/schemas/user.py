from __future__ import annotations
import asyncio
from typing import Set

from typing_extensions import override
from uuid import UUID

from pydantic.types import SecretStr

from db import LocalSession
from db.models.uni.discipline import Discipline
from db.models.user import User, UserDomain


from ...base.schemas import (
    ModelLookup,
    ModelView,
    ModelUpdateRequest,
    ModelIndex,
    ModelIndexPage,
)
from api.uni.schemas import CampusView


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
