from __future__ import annotations

from typing import Any, Coroutine, Type, Union
from uuid import UUID

from pydantic import SecretStr
from api.base.schemas import BaseModel, ApiModel
from db import LocalSession

from .types import UserDomain, UserRole
from . import models

class User(ApiModel[models.AbstractUser]):
    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        user = await models.AbstractUser.get_for_id(db, id)
        return await cls.from_model(user)

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str):
        user = await models.AbstractUser.get_for_email(db, email)
        return await cls.from_model(user)

    @classmethod
    async def from_model(cls, model: models.AbstractUser | User):
        return cls(
            domain=model.domain,
            id=model.id,
            email=model.email,
            disabled=model.disabled,
            roles=set(model.roles),
            created_at=model.created_at,
            updated_at=model.updated_at
        )

    domain: UserDomain
    email: str
    disabled: bool

    roles: set[UserRole]


class NativeUserLoginRequest(BaseModel):
    email: str
    password: SecretStr


class ExternalUserLoginRequest(BaseModel):
    email: str
    token_url: str
    auth_code: SecretStr


UserLoginRequest = NativeUserLoginRequest | ExternalUserLoginRequest


        