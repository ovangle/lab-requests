from __future__ import annotations

from uuid import UUID

from db import LocalSession
from db.models.uni import Campus
from db.models.uni.campus import query_campuses

from ..base import (
    ModelDetail,
    ModelLookup,
    ModelCreateRequest,
    ModelIndex,
    ModelIndexPage,
    ModelUpdateRequest,
)


class CampusDetail(ModelDetail[Campus]):
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


class CampusIndex(ModelIndex[Campus]):
    code_eq: str | None = None
    search: str | None = None

    async def item_from_model(self, model: Campus):
        return CampusDetail.from_model(model)

    def get_selection(self):
        return query_campuses(code_eq=self.code_eq, search=self.search)


CampusIndexPage = ModelIndexPage[Campus]


class CampusUpdateRequest(ModelUpdateRequest[Campus]):
    pass


class CampusCreateRequest(ModelCreateRequest[Campus]):
    pass
