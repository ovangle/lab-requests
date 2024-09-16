from __future__ import annotations

import re
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, ScalarResult, Select, Table, Column, UniqueConstraint, or_, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql

from db import LocalSession

from db.models.base.base import model_id
from db.models.fields import uuid_pk
from db.models.base import Base, DoesNotExist

from db.models.uni import Campus, Discipline, query_campuses
from db.models.user import User

if TYPE_CHECKING:
    from .disposable import LabDisposal
    from .storable import LabStorage


lab_supervisor = Table(
    "lab_supervisor",
    Base.metadata,
    Column("lab_id", ForeignKey("lab.id"), primary_key=True),
    Column("user_id", ForeignKey("user.id"), primary_key=True),
)


class LabDoesNotExist(DoesNotExist):
    def __init__(
        self,
        *,
        for_id: UUID | None = None,
        for_campus_discipline: tuple[UUID, Discipline] | None = None,
    ):
        msg = None
        if for_campus_discipline:
            campus_id, discipline = for_campus_discipline
            msg = f"No lab with campus '{campus_id}' and discipline {discipline}"

        super().__init__("Lab", msg, for_id=for_id)


class Lab(Base):
    __tablename__ = "lab"
    __table_args__ = (UniqueConstraint("campus_id", "discipline"),)
    id: Mapped[uuid_pk] = mapped_column()

    campus_id: Mapped[UUID] = mapped_column(ForeignKey("uni_campus.id"))
    campus: Mapped[Campus] = relationship()

    discipline: Mapped[Discipline] = mapped_column(postgresql.ENUM(Discipline))

    supervisors: Mapped[list[User]] = relationship(secondary=lab_supervisor)

    storages: Mapped[list[LabStorage]] = relationship(back_populates="lab")
    disposals: Mapped[list[LabDisposal]] = relationship(back_populates="lab")

    @classmethod
    async def get_for_id(cls, db: LocalSession, id):
        l = await db.get(Lab, id)
        if not l:
            raise LabDoesNotExist(for_id=id)
        return l

    @classmethod
    async def get_for_campus_and_discipline(
        cls, db: LocalSession, campus: Campus | UUID, discipline: Discipline
    ):
        campus_id = campus.id if isinstance(campus, Campus) else campus
        lab = await db.scalar(
            select(Lab).where(Lab.campus_id == campus_id, Lab.discipline == discipline)
        )

        if not lab:
            raise LabDoesNotExist(for_campus_discipline=(campus_id, discipline))
        return lab


def query_labs(
    campus: Select[tuple[Campus]] | list[Campus | UUID] | Campus | UUID | None = None,
    discipline: list[Discipline] | Discipline | None = None,
    search: str | None = None,
    id_in: list[UUID] | None = None,
    supervised_by: User | UUID | None = None,
) -> Select[tuple[Lab]]:
    clauses: list = []

    if isinstance(campus, Select):
        clauses.append(Lab.campus_id.in_(campus.scalar_subquery()))
    elif campus:
        if not isinstance(campus, list):
            campus = [campus]

        clauses.extend([Lab.campus_id == model_id(c) for c in campus])

    if discipline:
        if not isinstance(discipline, list):
            discipline = [discipline]
        clauses.extend([Lab.discipline == d for d in discipline])

    if search:
        search_components = re.compile(r'\s+').split(search)

        disciplines = []
        for s in search_components:
            try:
                d = Discipline(s)
                disciplines.append(d)
            except ValueError:
                pass

        clauses.append(
            or_(
                Lab.campus_id.in_(select(query_campuses(search=search).c.id)),
                *(Lab.discipline == d for d in disciplines),
            )
        )

    if id_in:
        clauses.append(Lab.id.in_(id_in))

    if supervised_by:
        supervisors = select(lab_supervisor.c.lab_id).where(
            lab_supervisor.c.user_id == model_id(supervised_by)
        )

        Lab.id.in_(supervisors.scalar_subquery())

    query = select(Lab).where(*clauses)
    print('lab query', query)
    return query
