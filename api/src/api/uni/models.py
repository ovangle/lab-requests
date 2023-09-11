from __future__ import annotations

from uuid import UUID

from typing import Iterable, Optional
from sqlalchemy import Table, Column, insert, Engine, select
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.types import VARCHAR, CHAR
from sqlalchemy.dialects.postgresql import ENUM

from api.base.models import Base
from api.utils.db import uuid_pk, LocalSession

from .types import CampusCode, campus_code
from .errors import CampusDoesNotExist

class Campus(Base):
    __tablename__ = 'campuses'

    id: Mapped[uuid_pk]
    code: Mapped[campus_code]
    name: Mapped[str] = mapped_column(VARCHAR(64))

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID) -> Campus:
        return await db.get(Campus, id)
        
    @classmethod
    async def get_for_campus_code(cls, db: LocalSession, code: str | CampusCode) -> Campus:
        code = CampusCode(code)
        result = await db.scalar(select(Campus).where(Campus.code == code))
        if not result:
            raise CampusDoesNotExist.for_code(code)
        return result

    @classmethod
    async def get_all_for_campus_codes(cls, db: LocalSession, codes: Iterable[str | CampusCode]) -> list[Campus]:
        return list(await db.scalars(
            select(Campus).where(Campus.code.in_(map(CampusCode, codes)))
        ))
        


async def seed_campuses(db: LocalSession):
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
    

