from __future__ import annotations

from uuid import UUID

from typing import Iterable, Optional
from sqlalchemy import Table, Column, insert, Engine, select
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.types import VARCHAR, CHAR
from sqlalchemy.dialects.postgresql import ENUM

from sqlalchemy.ext.asyncio import AsyncSession

from api.base.models import Base
from api.utils.db import uuid_pk, Session

from .types import CampusCode, campus_code
from .errors import CampusDoesNotExist



class Campus(Base):
    __tablename__ = 'campuses'

    id: Mapped[uuid_pk]
    code: Mapped[campus_code]
    name: Mapped[str] = mapped_column(VARCHAR(64))

    @classmethod
    async def get_for_id(cls, db: AsyncSession, id: UUID) -> Campus:
        result = (await db.execute(
            select(Campus).where(Campus.id == id)
        )).first()

        if not result:
            raise CampusDoesNotExist.for_id(id)
        return result[0]


    @classmethod
    async def get_for_campus_code(cls, db: AsyncSession, code: str | CampusCode, other_code_description: Optional[str] = None) -> Campus:
        code = CampusCode(code)
        result = (await db.execute(
            select(Campus).where(Campus.code == code)
        )).first()
        if not result:
            raise CampusDoesNotExist.for_code(code)
        return result[0]

    @classmethod
    async def get_all_for_campus_codes(cls, db: AsyncSession, codes: Iterable[str | CampusCode]) -> list[Campus]:
        results = await db.execute(
            select(Campus).where(Campus.code.in_(map(CampusCode, codes)))
        )
        return [result[0] for result in results]


async def seed_campuses(db: AsyncSession):
    all_known_campuses = [
        Campus(code=CampusCode('BNG'), name='Bundaberg'),
        Campus(code=CampusCode('CNS'), name='Cairns'),
        Campus(code=CampusCode('GLD'), name='Gold Coast'),
        Campus(code=CampusCode('MEL'), name='Melbourne'),
        Campus(code=CampusCode('MKY'), name='Mackay'),
        Campus(code=CampusCode('PTH'), name='Perth'),
        Campus(code=CampusCode('ROK'), name='Rockhampton'),
        Campus(code=CampusCode('SYD'), name='Sydney')
    ]
    existing_campuses = await Campus.get_all_for_campus_codes(db, (c.code for c in all_known_campuses))
    existing_campus_codes = {
        campus.code: campus 
        for campus in existing_campuses
    }
    db.add_all(campus for campus in all_known_campuses if campus.code not in existing_campus_codes)

    await db.commit()
    

