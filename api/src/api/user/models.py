from __future__ import annotations
import asyncio
from typing import ClassVar
from uuid import UUID
import warnings
from sqlalchemy import ARRAY, VARCHAR, Connection, select, insert, event

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncConnection
from sqlalchemy.orm import Mapped, mapped_column, EXT_STOP
from sqlalchemy.dialects import postgresql as pg_dialect
from api.user.errors import UserDoesNotExist
from sqlalchemy_utils.generic import generic_relationship

from passlib.hash import pbkdf2_sha256

from db import LocalSession
from db.orm import uuid_pk, email_str
from api.base.models import Base

from .types import UserRole, user_role, UserDomain


class AbstractUser(Base):
    __abstract__ = True
    domain: ClassVar[UserDomain]

    id: Mapped[uuid_pk]
    email: Mapped[email_str] 
    name: Mapped[str] = mapped_column(VARCHAR(256))
    disabled: Mapped[bool] = mapped_column(default=False)

    roles: Mapped[set[UserRole]] = mapped_column(
        ARRAY(VARCHAR(64)),
        server_default='{}'
    )

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        domain = (await _UserDomainMap.get_for_id(db, id)).domain

        match domain:
            case UserDomain.NATIVE:
                return await NativeUser.get_for_id(db, id)
            case UserDomain.EXTERNAL:
                return await ExternalUser.get_for_id(db, id)
            case _:
                raise ValueError(f'Invalid domain {domain}')

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str):
        domain = (await _UserDomainMap.get_for_email(db, email))
        match domain:
            case UserDomain.NATIVE:
                return await NativeUser.get_for_email(db, email)
            case UserDomain.EXTERNAL:
                return await ExternalUser.get_for_email(db, email)
            case _:
                raise ValueError(f'Invalid domain {domain}')




class NativeUser(AbstractUser):
    __tablename__ = 'native_users'
    domain = UserDomain.NATIVE

    password_hash: Mapped[str] = mapped_column(VARCHAR(256), default=None)

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID) -> NativeUser:
        user = await db.get(NativeUser, id)
        if not user:
            raise UserDoesNotExist.for_id(id, domain=UserDomain.NATIVE)
        return user

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str) -> NativeUser:
        user = await db.scalar(select(NativeUser).where(NativeUser.email == email))

        if not user:
            raise UserDoesNotExist.for_email(email, domain=UserDomain.NATIVE)
        return user

    def __init__(self, *, password=None, **kwargs):
        super().__init__(**kwargs)
        if 'password_hash' not in kwargs:
            if password is None:
                raise ValueError('Either password_hash or password must be supplied')
            self.set_password(password)

    def set_password(self, secret: str):
        self.password_hash = pbkdf2_sha256.hash(secret)

    def verify_password(self, secret: str) -> bool:
        return pbkdf2_sha256.verify(secret, self.password_hash)


class ExternalUser(AbstractUser):
    __tablename__ = 'external_users'
    domain = UserDomain.EXTERNAL

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        user = await db.get(ExternalUser, id)
        if not user:
            raise UserDoesNotExist.for_id(id, domain=UserDomain.EXTERNAL)
        return user
    
    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str):
        user = await db.scalar(
            select(ExternalUser)
            .where(ExternalUser.email == email)
        )
        if not user:
            raise UserDoesNotExist.for_email(email, domain=UserDomain.EXTERNAL)
        return user


class _UserDomainMap(Base):
    __tablename__ = 'user_domains'
    id: Mapped[uuid_pk]
    email: Mapped[str] = mapped_column(VARCHAR(256), default=None, unique=True)
    domain: Mapped[UserDomain] = mapped_column(pg_dialect.ENUM(UserDomain))

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        user2domain = await db.get(_UserDomainMap, id)
        if not user2domain:
            raise UserDoesNotExist.for_id(id)
        return user2domain

    @classmethod
    async def get_for_email(cls, db: LocalSession, email: str):
        user2domain = await db.scalar(
            select(_UserDomainMap).where(_UserDomainMap.email == email)
        )
        if not user2domain:
            raise UserDoesNotExist.for_email(email)
        return user2domain


def create_domain_map_entry(mapper, connection: Connection, target: AbstractUser, **kwargs):
    print(f'creating domain map entry for created user {target.id}')
    connection.execute(
        insert(_UserDomainMap).values(
            {'id': target.id, 'email': target.email, 'domain': target.domain}
        )
    )

event.listen(NativeUser, 'before_insert', create_domain_map_entry)
event.listen(ExternalUser, 'before_insert', create_domain_map_entry)

async def seed_users(db: LocalSession):
    def create_tech(email, name, password, tech_type):
        return NativeUser(
            email=email, 
            password=pbkdf2_sha256.hash(password), 
            name=name, 
            roles=['lab-tech', f'lab-tech-{tech_type}']
        )
    all_known_users = [
        create_tech('t.stephenson@cqu.edu.au', 'Thomas Stephenson', 'password', 'ICT')
    ]
    existing_user_emails = set(await db.scalars(
        select(NativeUser.email)
        .where(NativeUser.email.in_([user.email for user in all_known_users]))
    ))
    db.add_all([
        user for user in all_known_users 
        if user.email not in existing_user_emails
    ])
    #db.add_all([
    #    _UserDomainMap(email=user.email, id=user.id, domain=user.domain)
    #])
    await db.commit()


def user_relationship(domain_field, id_field) -> Mapped[AbstractUser]:
    """
    Establish a relationship to a user, either native or external

    e.g.  
    class FundingModel(Base):
        _supervisor_domain: Mapped[UserDomain] = mapped_column(ENUM(UserDomain))
        supervisor_id: Mapped[UUID] = mapped_column(UUID)
        supervisor = user_relationship(_supervisor_domain, supervisor_id)
    """

    return generic_relationship(domain_field, id_field)