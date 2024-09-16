from __future__ import annotations
import asyncio
from datetime import datetime
from http import HTTPStatus
from typing import Any, Self, Set

from typing_extensions import override
from uuid import UUID
from fastapi import HTTPException
from pydantic import BaseModel

from pydantic.types import SecretStr
from sqlalchemy import func, select

from db import LocalSession, local_object_session
from db.models.uni.discipline import Discipline
from db.models.user import TemporaryAccessToken, User, UserDomain, query_users


from ..base import (
    ModelCreateRequest,
    ModelLookup,
    ModelDetail,
    ModelUpdateRequest,
    ModelIndex,
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


class UserIndex(ModelIndex[User]):
    __item_detail_type__ = UserDetail

    id_in: str | None = None

    search: str | None = None
    include_roles: str | None = None

    discipline: Discipline | None = None

    supervises_lab: UUID | None = None

    async def item_from_model(self, model: User):
        return await UserDetail.from_model(model)

    def get_selection(self):
        if self.id_in:
            id_in = map(UUID, id_in.split(','))
        else:
            id_in = None

        if self.include_roles:
            include_role_set = set(self.include_roles.split(","))
        else:
            include_role_set = None

        return query_users(
            id_in=id_in,
            search=self.search,
            include_roles=include_role_set,
            discipline=self.discipline,
            supervises_lab=self.supervises_lab,
        )


# TODO: PEP 695
UserIndexPage = ModelIndexPage[User, UserDetail]


class AlterPasswordRequest(ModelUpdateRequest[User]):
    current_value: str
    new_value: str
