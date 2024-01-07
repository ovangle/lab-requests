from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING, Annotated, ClassVar
from uuid import UUID

from passlib.hash import pbkdf2_sha256

from sqlalchemy import ForeignKey, select
from sqlalchemy.ext.declarative import AbstractConcreteBase
from sqlalchemy.orm import Mapped, mapped_column, relationship, declared_attr
from sqlalchemy.dialects import postgresql

from db import LocalSession

from .base import Base, DoesNotExist
from .base.fields import uuid_pk

if TYPE_CHECKING:
    from db.models.uni import Campus


class UserDoesNotExist(DoesNotExist):
    def __init__(self, *, for_id: UUID | None = None, for_email: str | None = None):
        from .user import User

        msg = None
        if for_email:
            msg = f"User with email {for_email} does not exist"

        super().__init__(msg, for_id=for_id)


class UserDomain(Enum):
    NATIVE = "native"
    EXTERNAL = "external"


user_domain = Annotated[
    UserDomain, mapped_column(postgresql.ENUM(UserDomain), name="user_domain")
]


class User(Base):
    __tablename__ = "user"

    id: Mapped[uuid_pk]
    domain: Mapped[user_domain]

    email: Mapped[str] = mapped_column(postgresql.VARCHAR(256), unique=True, index=True)
    name: Mapped[str] = mapped_column(postgresql.TEXT)
    disabled: Mapped[bool] = mapped_column(default=False)

    campus_id: Mapped[UUID] = mapped_column(ForeignKey("uni_campus.id"))
    campus: Mapped[Campus] = relationship()

    roles: Mapped[set[str]] = mapped_column(
        postgresql.ARRAY(postgresql.VARCHAR(64)), server_default="{}"
    )

    @declared_attr
    def credentials(self) -> Mapped[UserCredentials]:
        return relationship("UserCredentials")

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
        if not isinstance(polymorphic_id, UserDomain):
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
        "polymorphic_identity": UserDomain.NATIVE,
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
        "polymorphic_identity": UserDomain.EXTERNAL,
        "concrete": True,
    }

    user_id = mapped_column(ForeignKey("user.id"), primary_key=True)
    provider: Mapped[str] = mapped_column(postgresql.VARCHAR(64))
