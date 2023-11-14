from __future__ import annotations
from uuid import UUID
from sqlalchemy import ARRAY, VARCHAR, select, insert

from sqlalchemy.ext.asyncio import AsyncConnection
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects import postgresql as pg_dialect
from api.user.errors import UserDoesNotExist

from passlib.hash import pbkdf2_sha256

from db import LocalSession
from db.orm import uuid_pk
from api.base.models import Base

from .types import UserRole, user_role, UserType

class AbstractUser(Base):
    __abstract__ = True

    type: Mapped[UserType] = mapped_column(pg_dialect.ENUM(UserType), default=UserType.NATIVE)
    id: Mapped[uuid_pk]
    email: Mapped[str] = mapped_column(VARCHAR(256), unique=True, index=True)
    disabled: Mapped[bool] = mapped_column(default=False)

class NativeUser(AbstractUser):
    __tablename__ = 'native_users'

    id: Mapped[uuid_pk]
    email: Mapped[str] = mapped_column(VARCHAR(256), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(VARCHAR(256), default=None)

    name: Mapped[str] = mapped_column(VARCHAR(256))

    roles: Mapped[list[UserRole]] = mapped_column(
        ARRAY(VARCHAR(64)),
        server_default='{}'
    )

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        user = await db.get(NativeUser, id)
        if not user:
            raise UserDoesNotExist.for_id(id)
        return user

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str):
        user = await db.scalar(select(NativeUser).where(NativeUser.email == email))

        if not user:
            raise UserDoesNotExist.for_email(email)
        return user

    def __init__(self, *, password=None, **kwargs):
        super().__init__(**kwargs)
        if 'password_hash' not in kwargs:
            if password is None:
                raise ValueError('Either password_hash or password must be supplied')
            self.set_password(password)

    def set_password(self, secret: str):
        self.password_hash = pbkdf2_sha256.hash(secret)

    async def verify_password(self, secret: str) -> bool:
        return pbkdf2_sha256.verify(secret, self.password_hash)

async def seed_users(db_connection: AsyncConnection):
    def create_tech(email, name, password, tech_type):
        return NativeUser(
            email=email, 
            password=password, 
            name=name, 
            roles=['lab-tech', f'lab-tech-{tech_type}']
        )
    all_known_users = [
        create_tech('t.stephenson@cqu.edu.au', 'Thomas Stephenson', 'password', 'ICT')
    ]
    async with db_connection.begin() as transaction:
        existing_user_emails = set(await db_connection.scalars(
            select(NativeUser.email)
            .where(NativeUser.email.in_([user.email for user in all_known_users]))
        ))
        await db_connection.execute(
            insert(NativeUser).values([
                user for user in all_known_users if user.email not in existing_user_emails
            ])
        )

        await transaction.commit()