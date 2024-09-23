from __future__ import annotations
from typing import Any, override

from uuid import UUID


from db import LocalSession
from db.models.uni.discipline import Discipline
from db.models.user import User, UserDomain


from ..base import (
    ModelLookup,
    ModelDetail,
    ModelUpdateRequest,
    ModelIndexPage,
)
from ..uni.campus import CampusLookup


class UserDetail(ModelDetail[User]):
    domain: UserDomain
    email: str
    name: str
    disciplines: set[Discipline]
    primary_discipline: Discipline
    base_campus: UUID

    disabled: bool
    roles: set[str]

    @classmethod
    async def _from_user(cls, model: User, **kwargs: Any):
        return await cls._from_base(
            model,
            domain=model.domain,
            email=model.email,
            name=model.name,
            base_campus=model.campus_id,
            disciplines=set(model.disciplines),
            primary_discipline=model.disciplines[0],
            disabled=model.disabled,
            roles=set(model.roles),
            **kwargs,
        )

    @classmethod
    async def from_model(cls, model: User):
        return await cls._from_user(model)


class UserLookup(ModelLookup[User]):
    id: UUID | None = None
    email: str | None = None
    username: str | None = None

    async def get(self, db: LocalSession) -> User:
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




# TODO: PEP 695
class UserIndexPage(ModelIndexPage[User, UserDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: User):
        return await UserDetail.from_model(item)


class AlterPasswordRequest(ModelUpdateRequest[User]):
    current_value: str
    new_value: str
