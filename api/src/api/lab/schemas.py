from __future__ import annotations
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel

from db import LocalSession
from db.models.uni import Discipline
from db.models.lab import Lab

from ..base.schemas import ModelLookup, ModelIndexPage, ModelView, ModelIndex

from ..uni.schemas import CampusView


class LabView(ModelView[Lab]):
    id: UUID
    type: Discipline
    campus: CampusView

    @classmethod
    async def from_model(cls, lab: Lab):
        from api.uni.schemas import CampusView

        campus = await CampusView.from_model(await lab.awaitable_attrs.campus)
        return cls(
            id=lab.id,
            type=lab.discipline,
            campus=campus,
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
