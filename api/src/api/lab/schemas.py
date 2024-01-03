from __future__ import annotations
from uuid import UUID

from pydantic import BaseModel

from db import LocalSession
from . import models


class Lab(BaseModel):
    id: UUID

    supervisor_emails: list[str]

    @classmethod
    async def from_model(cls, lab: Lab | models.Lab_):
        if isinstance(lab, models.Lab_):
            supervisor_emails = await lab.awaitable_attrs.supervisor_emails
        else:
            supervisor_emails = list(lab.supervisor_emails)

        return cls(id=lab.id, supervisor_emails=supervisor_emails)

    @classmethod
    async def get_for_id(cls, db: LocalSession, id: UUID):
        lab = await models.Lab_.get_for_id(db, id)
        return await cls.from_model(lab)
