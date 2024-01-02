from __future__ import annotations
import asyncio
from typing import Any, ClassVar, Iterable, TypeVar
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
from sqlalchemy.ext.asyncio import AsyncConnection
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

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID) -> AbstractUserImpl_:
        u = await db.get(User_, id)
        if u is None:
            raise UserDoesNotExist.for_id(id)
        return await u.load_impl(db)

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str) -> AbstractUserImpl_:
        u = await db.scalar(select(User_).where(User_.email == email))
        if u is None:
            raise UserDoesNotExist.for_email(email)
        return await u.load_impl(db)


    async def load_impl(self, db: LocalSession):
        match self.domain:
            case UserDomain.NATIVE:
                return await NativeUser_.get_for_id(db, self.id)
            case UserDomain.EXTERNAL:
                return await ExternalUser_.get_for_id(db, self.id)
            case _: 
                raise ValueError(f'Unrecognised domain {self.domain}')


class AbstractUserImpl_(Base):
    __abstract__ = True
    __user_domain__: ClassVar[UserDomain]

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)

    def __init_subclass__(cls, **kw: Any) -> None:
        if not isinstance(cls.__user_domain__, UserDomain):
            raise TypeError(f'{cls.__name__} missing required attr \'__user_domain__\'')

        return super().__init_subclass__(**kw)

    @declared_attr
    def user(self) -> Mapped[User_]:
        return relationship(single_parent=True, lazy='selectin')
    def __init__(
        self, *, email: str, name: str, roles: Iterable[str] | None = None, **kw
    ):
        super().__init__(**kw)
        self.user = User_(id=uuid4(), 
                          domain=self.__user_domain__,
                          email=email, name=name, roles=roles)

    @property
    def id(self):
        return self.user_id
    
    @property
    def domain(self):
        return self.__user_domain__

    @property
    def disabled(self):
        return self.user.disabled

    @property
    def name(self):
        return self.user.name

    @property
    def email(self):
        return self.user.email

    @property
    def roles(self):
        return self.user.roles


class NativeUser_(AbstractUserImpl_):
    __tablename__ = "native_users"
    __user_domain__ = UserDomain.NATIVE

    password_hash: Mapped[str] = mapped_column(pg_dialect.VARCHAR(256))

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        u = await db.get(NativeUser_, id)
        if u is None:
            raise UserDoesNotExist.for_id(id, domain=UserDomain.NATIVE)
        return u

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str):
        user_for_email = select(User_.id).where(User_.email == email) 

        u = await db.scalar(
            select(NativeUser_).where(NativeUser_.user_id.in_(user_for_email))
        )
        if u is None:
            raise UserDoesNotExist.for_email(email, domain=UserDomain.NATIVE)
        return u

    def __init__(
        self,
        *,
        email: str,
        name: str,
        password: str,
        roles: Iterable[str] | None,
        **kw,
    ):
        super().__init__(email=email, name=name, roles=roles, **kw)
        self.set_password(password)

    def set_password(self, password: str):
        self.password_hash = pbkdf2_sha256.hash(password)

    def verify_password(self, password: str) -> bool:
        return pbkdf2_sha256.verify(password, self.password_hash)


class ExternalUser_(AbstractUserImpl_):
    __tablename__ = "external_users"
    __user_domain__ = UserDomain.NATIVE

    provider: Mapped[str] = mapped_column(pg_dialect.VARCHAR(64))

    def __init__(
        self,
        *,
        email: str,
        name: str,
        provider: str,
        roles: Iterable[str] | None = None,
        **kw,
    ):
        super().__init__(email=email, name=name, roles=roles, **kw)
        self.provider = provider

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        u = await db.get(NativeUser_, id)
        if u is None:
            raise UserDoesNotExist.for_id(id, domain=UserDomain.NATIVE)
        return u

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str):
        user_for_email = select(User_).where(User_.email == email)

        u = await db.scalar(
            select(NativeUser_).where(NativeUser_.user_id.in_(user_for_email))
        )
        if u is None:
            raise UserDoesNotExist.for_email(email, domain=UserDomain.NATIVE)


async def seed_users(db: LocalSession):
    def create_tech(email, name, password, tech_type) -> NativeUser_:
        return NativeUser_(
            email=email,
            password=password,
            name=name,
            roles=["lab-tech", f"lab-tech-{tech_type}"],
        )

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
    db.add_all(
        [user for user in all_known_users if user.email not in existing_user_emails]
    )
    await db.commit()
