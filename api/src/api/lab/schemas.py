from __future__ import annotations
import asyncio
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel

from db import LocalSession
from db.models.user import User
from db.models.uni import Discipline
from db.models.lab import Lab

from ..base.schemas import ModelLookup, ModelIndexPage, ModelView, ModelIndex

from ..user.schemas.user import UserView
from ..uni.schemas import CampusView


class LabView(ModelView[Lab]):
    id: UUID
    discipline: Discipline
    campus: CampusView

    supervisors: list[UserView]

    @classmethod
    async def from_model(cls, lab: Lab):
        campus = await CampusView.from_model(await lab.awaitable_attrs.campus)

        supervisor_models = await lab.awaitable_attrs.supervisors

        supervisors = await asyncio.gather(
            *(UserView.from_model(s) for s in supervisor_models)
        )

        return cls(
            id=lab.id,
            discipline=lab.discipline,
            campus=campus,
            supervisors=supervisors,
            created_at=lab.created_at,
            updated_at=lab.updated_at,
        )


class LabLookup(ModelLookup[Lab]):
    id: UUID | None = None

    async def get(self, db: LocalSession):
        if self.id:
            return await Lab.get_for_id(db, id)
        raise ValueError("Expected an id")


async def lookup_lab(db: LocalSession, ref: LabLookup | UUID):
    if isinstance(ref, UUID):
        ref = LabLookup(id=ref)
    return await ref.get(db)


class LabIndex(ModelIndex[LabView, Lab]):
    __item_view__ = LabView


# TODO: PEP 695 type
LabIndexPage = ModelIndexPage[LabView, Lab]
