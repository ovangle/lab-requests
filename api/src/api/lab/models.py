from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, and_, event, Table, Column, select
from sqlalchemy.ext.asyncio import async_object_session
from sqlalchemy.orm import Mapped, mapped_column, relationship, object_session
from sqlalchemy.dialects import postgresql as pg_dialect

from db import LocalSession, db_metadata, local_sessionmaker
from db.orm import uuid_pk

from api.base.models import Base
from api.uni.types import CampusCode, Discipline
from api.user.types import UserDomain

if TYPE_CHECKING:
    from api.user.models import User_
    from api.uni.models import Campus


lab_supervisor = Table(
    "lab_supervisors",
    db_metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("lab_id", ForeignKey("labs.id"), primary_key=True),
)


class Lab_(Base):
    __tablename__ = "labs"
    id: Mapped[uuid_pk]

    campus_id: Mapped[UUID] = mapped_column(ForeignKey("campuses.id"))
    campus: Mapped[Campus] = relationship()

    discipline: Mapped[Discipline] = mapped_column(pg_dialect.ENUM(Discipline))

    supervisors: Mapped[list[User_]] = relationship(secondary=lab_supervisor)

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        return await db.get(cls, id)

    @property
    async def supervisor_emails(self):
        session = async_object_session(self)
        if session is None:
            raise RuntimeError('detached instance')

        supervisor_ids = select(lab_supervisor.c.user_id).where(
            lab_supervisor.c.lab_id == self.id
        )
        return await session.scalars(
            select(User_.email).where(User_.id.in_(supervisor_ids))
        )
    

async def seed_labs(db: LocalSession):
    async def create_lab(
        campus_code: CampusCode,
        discipline: Discipline,
        supervisor: User_
    ):
        campus = await Campus.get_for_campus_code(db, campus_code)
        if campus is None:
            raise ValueError('No campus with code {campus_code}')

        lab = Lab_(
            campus=campus,
            discipline=discipline
        )
        lab.supervisors.append(supervisor)
        return lab

    all_campus_code_disciplines = await db.scalars(
        select(Lab_.campus_id),
    )