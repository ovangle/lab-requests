from __future__ import annotations

from typing import Any, Coroutine, Type, Union
from uuid import UUID
from api.base.schemas import BaseModel, ApiModel
from db import LocalSession


from . import models

class AbstractUser(BaseModel):
    email: str
    disabled: bool


class NativeUser(AbstractUser, ApiModel[models.NativeUser]):
    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        return await NativeUser.get_for_id(db, id)

    @classmethod
    async def from_model(cls, model: models.NativeUser | NativeUser):
        return cls(
            id=model.id,
            email=model.email,
            disabled=model.disabled,
            created_at=model.created_at,
            updated_at=model.updated_at
        )


class NativeUserLoginRequest(BaseModel):
    email: str
    password: str

# TODO: All different types of user should be loginable.
UserLoginRequest = NativeUserLoginRequest | None