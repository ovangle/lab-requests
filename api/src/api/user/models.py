from __future__ import annotations
from sqlalchemy import ARRAY, VARCHAR

from sqlalchemy.orm import Mapped, mapped_column
from api.user.errors import UserDoesNotExist

from db import LocalSession
from db.orm import uuid_pk
from api.base.models import Base

from .types import UserRole, user_role


class User(Base):
    __tablename__ = 'users'

    id: Mapped[uuid_pk]
    email: Mapped[str] = mapped_column(VARCHAR(256))
    password: Mapped[str | None] = mapped_column(VARCHAR(256), default=None)

    roles: Mapped[list[UserRole]] = mapped_column(
        ARRAY(VARCHAR(64)),
        server_default='{}'
    )

    @classmethod
    async def get_by_id(cls, db: LocalSession, id):
        user = await db.get(User, id)
        if not user:
            raise UserDoesNotExist.for_id(id)
        return user
