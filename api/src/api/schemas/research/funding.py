from typing import Optional
from uuid import UUID, uuid4
from db import LocalSession

from db.models.research import ResearchFunding
from db.models.research.funding import query_research_fundings

from ..base import (
    ModelCreateRequest,
    ModelUpdateRequest,
    ModelDetail,
    ModelLookup,
    ModelIndexPage,
    ModelIndex,
)


class ResearchFundingDetail(ModelDetail[ResearchFunding]):
    id: UUID
    name: str
    description: str

    @classmethod
    async def from_model(cls, model: ResearchFunding):
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
    name_eq: str | None
    text: str

    async def item_from_model(self, model: ResearchFunding):
        return await ResearchFundingDetail.from_model(model)

    def get_selection(self):
        return query_research_fundings(name_eq=self.name_eq, text=self.text)


# TODO: PEP 695
ResearchFundingIndexPage = ModelIndexPage[ResearchFunding]


class ResearchFundingUpdateRequest(ModelUpdateRequest[ResearchFunding]):
    description: str

    async def do_update(self, model: ResearchFunding, **kwargs) -> ResearchFunding:
        if self.description != model.description:
            model.description = self.description

        return model


class ResearchFundingCreateRequest(ModelCreateRequest[ResearchFunding]):
    name: str
    description: str

    async def do_create(self, db: LocalSession, **kwargs) -> ResearchFunding:
        model = ResearchFunding(
            id=uuid4(), name=self.name, description=self.description
        )
        db.add(model)
        return model


ResearchFundingRef = ResearchFundingLookup | UUID


async def lookup_research_funding(db: LocalSession, ref: ResearchFundingRef):
    if isinstance(ref, UUID):
        return await ResearchFunding.get_for_id(db, ref)
    return await ref.get(db)


async def lookup_or_create_research_funding(
    db: LocalSession, ref_or_create: ResearchFundingRef | ResearchFundingCreateRequest
):
    match ref_or_create:
        case ResearchFundingCreateRequest():
            return await ref_or_create.do_create(db)
        case _:
            return await lookup_research_funding(db, ref_or_create)
