from __future__ import annotations
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel
from api.base.schemas import ApiModel
from api.uni.types import Discipline

from db import LocalSession
from . import models

if TYPE_CHECKING:
    from api.uni.schemas import Campus


class Lab(ApiModel[models.Lab_]):
    type: Discipline
    campus: Campus

    supervisor_emails: list[str]

    @classmethod
    async def from_model(cls, lab: Lab | models.Lab_):
        from api.uni.schemas import Campus

        if isinstance(lab, models.Lab_):
            supervisor_emails = list(await lab.get_supervisor_emails())
            type = lab.discipline

            campus_model = await lab.awaitable_attrs.campus
            campus = await Campus.from_model(campus_model)
        else:
            supervisor_emails = list(lab.supervisor_emails)
            campus = lab.campus
            type = lab.type

        return cls(
            id=lab.id,
            type=type,
            campus=campus,
            supervisor_emails=supervisor_emails,
            created_at=lab.created_at,
            updated_at=lab.updated_at,
        )

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        lab = await models.Lab_.get_for_id(db, id)
        return await cls.from_model(lab)

    async def to_model(self, db: LocalSession):
        return await models.Lab_.get_for_id(db, self.id)
