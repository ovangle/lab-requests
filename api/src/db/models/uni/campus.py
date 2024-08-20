from __future__ import annotations

import re
from uuid import UUID
from sqlalchemy import Select, or_, select
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects import postgresql

from db import LocalSession
from db.models.fields import uuid_pk
from ..base import Base, DoesNotExist


class CampusDoesNotExist(DoesNotExist):
    def __init__(
        self, *, for_id: UUID | None = None, for_campus_code: str | None = None
    ):
        if for_campus_code:
            msg = f"Campus with code {for_campus_code} does not exist"

        super().__init__("Campus", msg, for_id=for_id)


class Campus(Base):
    __tablename__ = "uni_campus"

    id: Mapped[uuid_pk] = mapped_column()
    code: Mapped[str] = mapped_column(postgresql.VARCHAR(4), unique=True, index=True)
    name: Mapped[str] = mapped_column(postgresql.VARCHAR(64), index=True)

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        campus = await db.get(Campus, id)

        if not campus:
            raise CampusDoesNotExist(for_id=id)
        return campus

    @classmethod
    async def get_for_campus_code(cls, db: LocalSession, code: str):
        campus = await db.scalar(select(Campus).where(Campus.code == code))
        if not campus:
            raise CampusDoesNotExist(for_campus_code=code)
        return campus

    def __init__(self, code: str, name: str):
        super().__init__()
        self.code = code
        self.name = name


def query_campuses(
    code_eq: str | None = None,
    search: str | None = None,
) -> Select[tuple[Campus]]:
    clauses = []

    if code_eq is not None:
        return select(Campus).where(Campus.code == code_eq)

    if search:
        clauses.append(
            or_(Campus.name.ilike(f"%{search}%"), Campus.code.ilike(f"%{search}%"))
        )
    return select(Campus).where(*clauses)
