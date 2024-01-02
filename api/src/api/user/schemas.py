from __future__ import annotations

from typing import TYPE_CHECKING, Any, Coroutine, Type, Union
from typing_extensions import override
from uuid import UUID

from pydantic import SecretStr
from api.base.schema_config import SCHEMA_CONFIG
from api.base.schemas import BaseModel, ApiModel
from api.user.errors import AlterPasswordConflictError, NotANativeUserError
from db import LocalSession

from .types import UserDomain, UserRole
from . import models

if TYPE_CHECKING:
    from api.lab.schemas import Lab


class User(ApiModel[models.AbstractUserImpl_]):
    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        user = await models.User_.get_for_id(db, id)
        return await cls.from_model(user)

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str):
        user = await models.User_.get_for_email(db, email)
        return await cls.from_model(user)

    @classmethod
    async def from_model(cls, model: models.AbstractUserImpl_ | User):
        if isinstance(model, models.AbstractUserImpl_):
            session = async_object_session(model)
            if session is None:
                raise RuntimeError('Detached object')
            select_lab_ids = select(Lab_)
            
        return cls(
            domain=model.domain,
            id=model.id,
            email=model.email,
            disabled=model.disabled,
            roles={UserRole(r) for r in model.roles},
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    domain: UserDomain
    email: str
    disabled: bool

    roles: set[UserRole]

    labs: list[Lab]

    @override
    async def to_model(self, db: LocalSession):
        return await models.User_.get_for_email(db, self.email)


class NativeUserLoginRequest(BaseModel):
    email: str
    password: SecretStr


class ExternalUserLoginRequest(BaseModel):
    email: str
    token_url: str
    auth_code: SecretStr


UserLoginRequest = NativeUserLoginRequest | ExternalUserLoginRequest


class AlterPasswordRequest(BaseModel):
    model_config = SCHEMA_CONFIG

    current_value: str
    new_value: str

    async def __call__(self, db: LocalSession, user: User):
        if user.domain == "native":
            model_user = await user.to_model(db)
            assert isinstance(model_user, models.NativeUser_)
            if not model_user.verify_password(self.current_value):
                raise AlterPasswordConflictError(user)
            model_user.set_password(self.new_value)
            db.add(model_user)
            return user
        else:
            raise NotANativeUserError(user)
