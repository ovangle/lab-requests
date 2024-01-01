from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, and_, event, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql as pg_dialect

from db import db_metadata

from api.base.models import Base
from api.uni.types import Discipline
from api.user.types import UserDomain

if TYPE_CHECKING:
    from api.user.models import User_
    from api.uni.models import Campus


lab_supervisor = Table(
    "lab_supervisors",
    db_metadata,
    Column("user_id", pg_dialect.UUID, primary_key=True),
    Column("lab_id", pg_dialect.UUID, primary_key=True),
)


class Lab_(Base):
    __tablename__ = "labs"
    campus_id: Mapped[UUID] = mapped_column(ForeignKey("campuses.id"))
    campus: Mapped[Campus] = relationship()

    discipline: Mapped[Discipline] = mapped_column(pg_dialect.ENUM(Discipline))

    supervisors: Mapped[list[User_]] = relationship(secondary=lab_supervisor)
