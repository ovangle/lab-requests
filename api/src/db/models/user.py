from __future__ import annotations
from datetime import datetime, timedelta, timezone

from enum import Enum
import random
from typing import TYPE_CHECKING, Annotated, ClassVar
from uuid import UUID

from passlib.hash import pbkdf2_sha256

from sqlalchemy import ForeignKey, TypeDecorator, func, select
from sqlalchemy.ext.declarative import AbstractConcreteBase
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr
from sqlalchemy.dialects import postgresql

from db import LocalSession, local_object_session

from .base import Base, DoesNotExist
from .base.fields import uuid_pk

from ..models.uni import Campus, Discipline


class UserDoesNotExist(DoesNotExist):
    def __init__(
        self,
        *,
        for_id: UUID | None = None,
        for_email: str | None = None,
        for_temporary_token: str | None = None,
    ):
        from .user import User

        if for_id:
            return super().__init__(for_id=for_id)
        if for_email:
            msg = f"User with email {for_email} does not exist"
            return super().__init__(msg)
        if for_temporary_token:
            msg = f"User does not exist with temporary user token {for_temporary_token}"
            return super().__init__(msg)
        raise NotImplementedError


class UserDomain(Enum):
    NATIVE = "native"
    EXTERNAL = "external"


user_domain = Annotated[
    UserDomain, mapped_column(postgresql.ENUM(UserDomain, name="user_domain"))
]


class User(Base):
    __tablename__ = "user"

    id: Mapped[uuid_pk]
    domain: Mapped[user_domain]

    email: Mapped[str] = mapped_column(postgresql.VARCHAR(256), unique=True, index=True)
    name: Mapped[str] = mapped_column(postgresql.TEXT)
    disabled: Mapped[bool] = mapped_column(default=False)

    title: Mapped[str] = mapped_column(postgresql.VARCHAR(256))

    campus_id: Mapped[UUID] = mapped_column(ForeignKey("uni_campus.id"))
    campus: Mapped[Campus] = relationship()

    disciplines: Mapped[list[Discipline]] = mapped_column(
        postgresql.ARRAY(postgresql.ENUM(Discipline)), server_default="{}"
    )

    roles: Mapped[list[str]] = mapped_column(
        postgresql.ARRAY(postgresql.VARCHAR(64)),
        server_default="{}",
    )

    @property
    def role_set(self):
        return set(self.roles)

    @role_set.setter
    def role_set(self, value: set[str]):
        self.roles = list(value)

    @property
    def primary_discipline(self) -> Discipline | None:
        try:
            return self.disciplines[0]
        except IndexError:
            return None

    @declared_attr
    def credentials(self) -> Mapped[list[UserCredentials]]:
        return relationship("UserCredentials", back_populates="user")

    temporary_access_tokens: Mapped[list[TemporaryAccessToken]] = relationship(
        "TemporaryAccessToken", back_populates="user"
    )

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        user = await db.get(User, id)
        if not user:
            raise UserDoesNotExist(for_id=id)
        return user

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str):
        user = await db.scalar(select(User).where(User.email == email))
        if not user:
            raise UserDoesNotExist(for_email=email)
        return user

    async def get_latest_temporary_access_token(self) -> TemporaryAccessToken | None:
        db = local_object_session(self)
        latest_created_at = (
            select(func.max(TemporaryAccessToken.created_at))
            .where(TemporaryAccessToken.user_id == self.id)
            .scalar_subquery()
        )

        return await db.scalar(
            select(TemporaryAccessToken).where(
                TemporaryAccessToken.user_id == self.id,
                TemporaryAccessToken.created_at == latest_created_at,
            )
        )

    async def get_temporary_access_token(
        self, token: str
    ) -> TemporaryAccessToken | None:
        db = local_object_session(self)
        return await db.scalar(
            select(TemporaryAccessToken).where(
                TemporaryAccessToken.user_id == self.id,
                TemporaryAccessToken.token == token,
            )
        )


class UserCredentials(AbstractConcreteBase, Base):
    strict_attrs = True
    __tablename__ = "user_credentials"
    __user_domain__: ClassVar[UserDomain]

    @classmethod
    def __init_subclass__(cls):
        mapper_args = cls.__mapper_args__
        if not mapper_args["concrete"]:
            raise TypeError(
                "UserCredentials subclass '{cls.__name__}' must be a concrete mapping"
            )
        polymorphic_id = mapper_args["polymorphic_identity"]
        try:
            cls.__user_domain__ = UserDomain(polymorphic_id)
        except ValueError:
            raise TypeError(
                f"UserCredentials subclass '{cls.__name__}' must have a UserDomain polymorphic_identity"
            )
        setattr(cls, "__user_domain__", mapper_args["polymorphic_identity"])

        return super().__init_subclass__()

    user_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"), primary_key=True)

    @declared_attr
    def user(cls) -> Mapped[User]:
        return relationship(User, back_populates="credentials", single_parent=True)

    @classmethod
    async def get_for_user(cls, db: LocalSession, user: User | UUID):
        user_id = user.id if isinstance(user, User) else user
        credentials = await db.get(cls, user_id)

        if not credentials:
            raise UserDoesNotExist(for_id=user_id)

        return credentials


class NativeUserCredentials(UserCredentials):
    __tablename__ = "native_user_credentials"
    __mapper_args__ = {
        "polymorphic_identity": UserDomain.NATIVE.value,
        "concrete": True,
    }
    user_id = mapped_column(ForeignKey("user.id"), primary_key=True)
    password_hash: Mapped[str] = mapped_column(postgresql.VARCHAR(256))

    def __init__(self, *, user: User, password: str):
        self.user_id = user.id
        self.set_password(password)
        super().__init__()

    def set_password(self, password: str):
        self.password_hash = pbkdf2_sha256.hash(password)

    def verify_password(self, password: str):
        return pbkdf2_sha256.verify(password, self.password_hash)


class ExternalUserCredentials(UserCredentials):
    __tablename__ = "external_user_credentials"
    __mapper_args__ = {
        "polymorphic_identity": UserDomain.EXTERNAL.value,
        "concrete": True,
    }

    user_id = mapped_column(ForeignKey("user.id"), primary_key=True)
    provider: Mapped[str] = mapped_column(postgresql.VARCHAR(64))


def _generate_temporary_user_token():
    """
    Generates a random hexadecimal string 32 characters long
    """
    return "{:03x}".format(random.randrange(16**32))


class TemporaryAccessToken(Base):
    """
    A temporary access token which has been generated for the user in order to
    set/reset a password
    """

    __tablename__ = "user_temporary_access_token"

    id: Mapped[uuid_pk]
    user_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    user: Mapped[User] = relationship(User, back_populates="temporary_access_tokens")
    token: Mapped[str] = mapped_column(
        postgresql.VARCHAR(32),
        default=_generate_temporary_user_token,
        unique=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        postgresql.TIMESTAMP(timezone=True),
        default=datetime.now(tz=timezone.utc) + timedelta(hours=24),
    )
    consumed_at: Mapped[datetime | None] = mapped_column(
        postgresql.TIMESTAMP(timezone=True), default=None
    )

    @property
    def is_expired(self):
        return self.expires_at < datetime.now(tz=timezone.utc)

    @property
    def is_consumed(self):
        return self.consumed_at is not None

    async def create_native_credentials(self, password: str):
        db = local_object_session(self)
        user = await db.get(User, self.user_id)
        assert user is not None

        credentials = NativeUserCredentials(user=user, password=password)
        db.add(credentials)

        self.consumed_at = datetime.now(tz=timezone.utc)
        db.add(self)

        user.disabled = False
        db.add(user)
