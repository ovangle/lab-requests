from typing import Optional
from uuid import UUID, uuid4
from db import LocalSession

from db.models.research import ResearchFunding

from ...base.schemas import (
    ModelCreateRequest,
    ModelUpdateRequest,
    ModelView,
    ModelLookup,
    ModelIndexPage,
    ModelIndex,
)


class ResearchFundingView(ModelView[ResearchFunding]):
    id: UUID
    name: str
    description: str

    @classmethod
    async def from_model(cls, model: ResearchFunding, **kwargs):
        return cls(
            id=model.id,
            name=model.name,
            description=model.description,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class ResearchFundingLookup(ModelLookup[ResearchFunding]):
    id: Optional[UUID] = None
    name: Optional[str] = None

    async def get(self, db: LocalSession):
        if self.id:
            return await ResearchFunding.get_for_id(db, self.id)
        if self.name:
            return await ResearchFunding.get_for_name(db, self.name)
        raise ValueError("Either id or name must be provided")


class ResearchFundingIndex(ModelIndex[ResearchFunding]):
    __item_view__ = ResearchFundingView


# TODO: PEP 695
ResearchFundingIndexPage = ModelIndexPage[ResearchFunding]


class ResearchFundingUpdateRequest(ModelUpdateRequest[ResearchFunding]):
    description: str

    async def do_update(self, model: ResearchFunding) -> ResearchFunding:
        if self.description != model.description:
            model.description = self.description

        return model


class ResearchFundingCreateRequest(ModelCreateRequest[ResearchFunding]):
    name: str
    description: str

    async def do_create(self, db: LocalSession) -> ResearchFunding:
        model = ResearchFunding(
            id=uuid4(), name=self.name, description=self.description
        )
        db.add(model)
        return model


ResearchFundingRef = ResearchFundingLookup | UUID


async def lookup_research_funding(db: LocalSession, ref: ResearchFundingRef):
    if isinstance(ref, UUID):
        ref = ResearchFundingLookup(id=ref)
    return await ref.get(db)


async def lookup_or_create_research_funding(
    db: LocalSession, ref_or_create: ResearchFundingRef | ResearchFundingCreateRequest
):
    match ref_or_create:
        case ResearchFundingCreateRequest():
            return await ref_or_create.do_create(db)
        case _:
            return lookup_research_funding(db, ref_or_create)
