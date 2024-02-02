from __future__ import annotations
from enum import Enum

from uuid import UUID

from db import LocalSession
from db.models.uni import Campus

from ..base.schemas import (
    ModelCreateRequest,
    ModelIndexPage,
    ModelLookup,
    ModelView,
    ModelUpdateRequest,
    ModelIndex,
)


class CampusView(ModelView[Campus]):
    id: UUID
    code: str
    name: str

    @classmethod
    async def from_model(cls, model: Campus, **kwargs):
        assert not kwargs
        return cls(
            id=model.id,
            code=model.code,
            name=model.name,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class CampusLookup(ModelLookup[Campus]):
    id: UUID | None = None
    code: str | None = None

    async def get(self, db: LocalSession):
        if self.id:
            return await Campus.get_for_id(db, self.id)
        if self.code:
            return await Campus.get_for_campus_code(db, self.code)
        raise ValueError("Expected an ID or code")


async def lookup_campus(db: LocalSession, ref: CampusLookup | UUID):
    if isinstance(ref, UUID):
        ref = CampusLookup(id=ref)
    return await ref.get(db)


class CampusIndex(ModelIndex[CampusView]):
    __item_view__ = CampusView


CampusIndexPage = ModelIndexPage[CampusView]


class CampusUpdateRequest(ModelUpdateRequest[Campus]):
    pass


class CampusCreateRequest(ModelCreateRequest[Campus]):
    pass
