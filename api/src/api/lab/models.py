from __future__ import annotations
import asyncio
from pathlib import Path

from typing import TYPE_CHECKING
from uuid import UUID
import pandas

from sqlalchemy import ForeignKey, and_, event, Table, Column, insert, select
from sqlalchemy.ext.asyncio import async_object_session
from sqlalchemy.orm import Mapped, mapped_column, relationship, object_session
from sqlalchemy.dialects import postgresql as pg_dialect
from api.lab.errors import LabDoesNotExist

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
        lab = await db.get(cls, id)
        if lab is None:
            raise LabDoesNotExist.for_id(id)
        return lab

    @classmethod
    async def get_all_supervised_by(cls, db: LocalSession, user_id: UUID):
        supervisor_ids = select(lab_supervisor.c.lab_id).where(
            lab_supervisor.c.user_id == user_id
        )

        return await db.scalars(select(Lab_).where(Lab_.id.in_(supervisor_ids)))

    async def get_supervisor_emails(self):
        from api.user.models import User_

        session = async_object_session(self)
        if session is None:
            raise RuntimeError("detached instance")

        supervisor_ids = select(lab_supervisor.c.user_id).where(
            lab_supervisor.c.lab_id == self.id
        )
        return await session.scalars(
            select(User_.email).where(User_.id.in_(supervisor_ids))
        )


async def seed_labs(db: LocalSession):
    from api.uni.models import Campus

    all_campus_id_disciplines = set(
        await db.execute(select(Lab_.campus_id, Lab_.discipline))
    )

    def create_lab_if_not_exists(campus_id: UUID, discipline: Discipline):
        lab = Lab_(campus_id=campus_id, discipline=discipline)
        if (lab.campus_id, lab.discipline) not in all_campus_id_disciplines:
            print("adding lab", lab.campus_id, lab.discipline)
            db.add(lab)

    def create_all_labs_for_campus(campus_id: UUID):
        for discipline in Discipline:
            create_lab_if_not_exists(campus_id, discipline)

    all_campuses = await db.scalars(select(Campus.id))

    for campus_id in all_campuses:
        create_all_labs_for_campus(campus_id)
    await db.commit()


async def seed_lab_supervisors(db: LocalSession, project_root: Path):
    from api.user.models import (
        User_,
        get_user_seeds,
        parse_discipline_from_user_seed_discipline,
    )

    user_seeds = get_user_seeds(project_root)

    async def add_lab_supervisors(lab: Lab_):
        existing_supervisors = set(
            await db.execute(
                select(lab_supervisor.c.user_id).where(
                    lab_supervisor.c.lab_id == lab.id
                )
            )
        )

        campus_users = await User_.get_all_for_campus_id(db, lab.campus_id)
        for user in campus_users:
            _, user_row = next(
                iter(user_seeds.query("Email == @user.email").iterrows())
            )

            location_str = str(user_row.get("Dis"))
            disciplines = parse_discipline_from_user_seed_discipline(location_str)

            if lab.discipline in disciplines:
                if user.id not in existing_supervisors:
                    print(
                        f"\tAdding supervisor {user.email} to campus {lab.campus_id} - {lab.discipline.value}"
                    )
                    await db.execute(
                        insert(lab_supervisor).values(user_id=user.id, lab_id=lab.id)
                    )
        await db.commit()

    for lab in await db.scalars(select(Lab_)):
        await add_lab_supervisors(lab)
