from typing import Optional
from sqlalchemy import Table, Column, insert, Engine, select
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.types import VARCHAR, CHAR
from sqlalchemy.dialects.postgresql import UUID, ENUM

from api.base.models import Base
from api.utils.db import uuid_pk, Session

from .types import CampusCode

class Campus(Base):
    __table_name__ = 'campuses'
    id: uuid_pk
    code: Mapped[CampusCode] = mapped_column(ENUM(CampusCode))
    description: Mapped[str] = mapped_column(VARCHAR(64), unique=True)


async def seed_campuses():
    to_seed_campuses = {
        campus.code: campus
        for campus in [
            Campus(code=CampusCode.BNG, description='Bundaberg'),
            Campus(code=CampusCode.CNS, description='Cairns'),
            Campus(code=CampusCode.GLD, description='Gold Coast'),
            Campus(code=CampusCode.MEL, description='Melbourne'),
            Campus(code=CampusCode.MKY, description='Mackay'),
            Campus(code=CampusCode.PTH, description='Perth'),
            Campus(code=CampusCode.ROK, description='Rockhampton'),
            Campus(code=CampusCode.SYD, description='Sydney'),
        ]
    }

    async with Session() as session:
        to_seed_codes = [code for code in CampusCode if code != CampusCode.OTH]
        seeded_code_results = await session.execute(
            select(Campus.code).where(Campus.code.in_(to_seed_codes))
        )

        seeded_codes = [c[0] for c in seeded_code_results]
        missing_codes = [
            code for code in CampusCode 
            if code not in seeded_codes and code != CampusCode.OTH]

        session.add_all([
            to_seed_campuses[code]
            for code in missing_codes
       ])
        await session.commit()

