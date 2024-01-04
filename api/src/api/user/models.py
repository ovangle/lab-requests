from __future__ import annotations
import asyncio
from typing import TYPE_CHECKING, Any, ClassVar, Iterable, TypeVar
from uuid import UUID, uuid4
import warnings
from sqlalchemy import (
    ARRAY,
    VARCHAR,
    Connection,
    ForeignKey,
    and_,
    select,
    insert,
    event,
)

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncConnection, async_object_session
from sqlalchemy.orm import Mapped, mapped_column, EXT_STOP, relationship, declared_attr
from sqlalchemy.dialects import postgresql as pg_dialect
from api.user.errors import UserDoesNotExist

from sqlalchemy import Table, Column

from passlib.hash import pbkdf2_sha256

from db import LocalSession, db_metadata
from db.orm import uuid_pk, email_str
from api.base.models import Base

from .types import UserRole, user_role, UserDomain


class User_(Base):
    __tablename__ = "users"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    domain: Mapped[UserDomain] = mapped_column(pg_dialect.ENUM(UserDomain))
    email: Mapped[str] = mapped_column(pg_dialect.VARCHAR(256), unique=True, index=True)
    name: Mapped[str] = mapped_column(pg_dialect.TEXT)
    disabled: Mapped[bool] = mapped_column(default=False)
    roles: Mapped[set[str]] = mapped_column(
        pg_dialect.ARRAY(pg_dialect.VARCHAR(64)), server_default="{}"
    )

    credentials: Mapped[UserCredentials_] = relationship("UserCredentials_")

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID) -> User_:
        u = await db.get(User_, id)
        if u is None:
            raise UserDoesNotExist.for_id(id)
        return u

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str) -> User_:
        u = await db.scalar(select(User_).where(User_.email == email))
        if u is None:
            raise UserDoesNotExist.for_email(email)
        return u

    async def get_supervised_labs(self):
        from api.lab.models import Lab_

        session = async_object_session(self)
        if not isinstance(session, LocalSession):
            raise RuntimeError("Object detached from session")

        return await Lab_.get_all_supervised_by(session, self.id)


class UserCredentials_(Base):
    __tablename__ = "user_credentials"
    __mapper_args__ = {"polymorphic_on": "domain", "polymorphic_load": "inline"}
    __user_domain__: ClassVar[UserDomain]

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    domain: Mapped[UserDomain] = mapped_column(pg_dialect.ENUM(UserDomain))

    def __init_subclass__(cls, **kw: Any) -> None:
        if not isinstance(cls.__user_domain__, UserDomain):
            raise TypeError(f"{cls.__name__} missing required attr '__user_domain__'")

        return super().__init_subclass__(**kw)

    def __init__(self, user_id: UUID):
        super().__init__()
        self.user_id = user_id
        self.domain = self.__user_domain__


class NativeUserCredentials_(UserCredentials_):
    __user_domain__ = UserDomain.NATIVE
    __mapper_args__ = {"polymorphic_identity": UserDomain.NATIVE}

    password_hash: Mapped[str] = mapped_column(pg_dialect.VARCHAR(256), nullable=True)

    def __init__(self, user_id: UUID, password: str):
        super().__init__(user_id)
        self.set_password(password)

    def set_password(self, password: str):
        self.password_hash = pbkdf2_sha256.hash(password)

    async def verify_password(self, password: str) -> bool:
        password_hash = await self.awaitable_attrs.password_hash
        return pbkdf2_sha256.verify(password, password_hash)


class ExternalUserCredentials_(UserCredentials_):
    __user_domain__ = UserDomain.NATIVE
    __mapper_args__ = {"polymorphic_identity": UserDomain.EXTERNAL}

    provider: Mapped[str] = mapped_column(pg_dialect.VARCHAR(64), nullable=True)

    def __init__(self, user_id: UUID, provider: str):
        super().__init__(user_id)
        self.provider = provider


async def seed_users(db: LocalSession):
    def create_tech(email, name, password, tech_type) -> User_:
        u = User_(
            id=uuid4(),
            domain=UserDomain.NATIVE,
            email=email,
            name=name,
            roles=["lab-tech", f"lab-tech-{tech_type}"],
        )
        u.credentials = NativeUserCredentials_(u.id, password)
        return u

    all_known_users = [
        create_tech("t.stephenson@cqu.edu.au", "Thomas Stephenson", "password", "ICT")
    ]
    existing_user_emails = set(
        await db.scalars(
            select(User_.email).where(
                User_.email.in_([user.email for user in all_known_users])
            )
        )
    )
    users_to_add = [
        user for user in all_known_users if user.email not in existing_user_emails
    ]
    db.add_all(users_to_add)
    db.add_all([u.credentials for u in users_to_add])
    await db.commit()
