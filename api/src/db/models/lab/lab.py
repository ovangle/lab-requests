from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Table, Column, UniqueConstraint, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql

from db import LocalSession

from ..base.fields import uuid_pk
from ..base import Base, DoesNotExist
from ..uni import Campus, Discipline

if TYPE_CHECKING:
    from db.models.user import User


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

        super().__init__(msg, for_id=for_id)


class Lab(Base):
    __tablename__ = "lab"
    __table_args__ = (UniqueConstraint("campus_id", "discipline"),)
    id: Mapped[uuid_pk]

    campus_id: Mapped[UUID] = mapped_column(ForeignKey("uni_campus.id"))
    campus: Mapped[Campus] = relationship()

    discipline: Mapped[Discipline] = mapped_column(postgresql.ENUM(Discipline))

    supervisors: Mapped[list[User]] = relationship(secondary=lab_supervisor)

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
