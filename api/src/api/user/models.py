from __future__ import annotations
import asyncio
import os
from pathlib import Path
import re
from typing import TYPE_CHECKING, Any, ClassVar, Iterable, TypeVar
from uuid import UUID, uuid4
import warnings
import pandas
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
from api.uni.types import CampusCode, Discipline
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

    campus_id: Mapped[UUID] = mapped_column(ForeignKey("campuses.id"))

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

    @classmethod
    async def get_all_for_campus_id(cls, db: LocalSession, campus_id: UUID):
        return await db.scalars(select(User_).where(User_.campus_id == campus_id))

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


def get_user_seeds(project_root: Path) -> pandas.DataFrame:
    import pandas

    seed_users_xlsx = project_root / "assets" / "seed_users.xlsx"
    if not seed_users_xlsx.exists():
        raise RuntimeError(
            f"Could not find excel file containing user seeds at {seed_users_xlsx!s}"
        )
    return pandas.read_excel(seed_users_xlsx)


def parse_campus_code_from_user_seed_location(location_str: str) -> CampusCode:
    m = re.search(r"\(([A-Z]+)\)", location_str)

    if not m:
        raise ValueError(f"Unexpected location {location_str}")

    campus_code_mappings = {
        "MELB": CampusCode("MEL"),
        "CAIR": CampusCode("CNS"),
        "GLAD": CampusCode("GLD"),
        "ROCK": CampusCode("ROK"),
        "MACK": CampusCode("MKY"),
    }
    return campus_code_mappings[m.group(1)]


def parse_discipline_from_user_seed_discipline(discipline_str: str) -> list[Discipline]:
    from api.uni.types import Discipline

    discipline_str = discipline_str.strip().lower()

    match discipline_str:
        case "ict":
            return [Discipline.ICT]
        case "civil":
            return [Discipline.CIVIL]
        case "elec":
            return [Discipline.ELECTRICAL]
        case "mech":
            return [Discipline.MECHANICAL]
        case "multi":
            return list(Discipline)
        case "workshop":
            return []
        case _:
            raise ValueError(f"Unexpected discipline from seed '{discipline_str}'")


async def seed_users(db: LocalSession, *, project_root: Path):
    def create_tech(email, name, campus, disciplines: list[Discipline]) -> User_:
        u = User_(
            id=uuid4(),
            domain=UserDomain.NATIVE,
            campus_id=campus.id,
            email=email,
            name=name,
            roles=["lab-tech", *[f"lab-tech-{d.value}" for d in disciplines]],
        )
        u.credentials = NativeUserCredentials_(u.id, "password")
        return u

    async def get_campus(campus_code):
        from api.uni.models import Campus

        campus = await db.scalar(select(Campus).where(Campus.code == campus_code))
        if campus is None:
            raise ValueError("Unexpected campus code", campus_code)
        return campus

    campus_seeds = get_user_seeds(project_root)

    for index, row in campus_seeds.iterrows():
        print(index, row.get("Email"), row.get("Dis"))

    all_known_users = [
        create_tech(
            email=row.get("Email"),
            name=row.get("Name"),
            campus=await get_campus(
                parse_campus_code_from_user_seed_location(str(row.get("Location")))
            ),
            disciplines=parse_discipline_from_user_seed_discipline(str(row.get("Dis"))),
        )
        for _, row in campus_seeds.iterrows()
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
