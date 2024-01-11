from __future__ import annotations
import asyncio

from typing import TYPE_CHECKING, Any, Coroutine, Self, Type, Union
from typing_extensions import override
from uuid import UUID

from pydantic.types import SecretStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_object_session

from api.base.schemas import BaseModel

from db import LocalSession
from db.models.user import NativeUserCredentials, User, UserDomain
from db.models.lab import Lab
from db.models.research import ResearchPlan


from ..base.schemas import (
    ModelLookup,
    ModelView,
    ModelUpdateRequest,
    ModelIndex,
    ModelIndexPage,
)

if TYPE_CHECKING:
    from ..lab.schemas import LabIndexPage
    from ..research.schemas import ResearchPlanIndexPage


class UserView(ModelView[User]):
    id: UUID
    domain: UserDomain
    email: str
    name: str

    disabled: bool
    roles: set[str]

    @classmethod
    async def from_model(cls, model: User, **kwargs):
        return cls(
            id=model.id,
            domain=model.domain,
            email=model.email,
            name=model.name,
            disabled=model.disabled,
            roles=set(model.roles),
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class UserLookup(ModelLookup[User]):
    id: UUID | None = None
    email: str | None = None
    username: str | None = None

    async def get(self, db: LocalSession):
        if self.id:
            return await User.get_for_id(db, self.id)
        if self.email:
            return await User.get_for_email(db, self.email)
        if self.username:
            return await User.get_for_email(db, self.username)
        raise ValueError("At least one of id, email, username must be provided")


# TODO: PEP 695
UserRef = UserLookup | UUID


async def lookup_user(db: LocalSession, ref: UserRef):
    if isinstance(ref, UUID):
        ref = UserLookup(id=ref)
    return await ref.get(db)


class UserIndex(ModelIndex[User]):
    __item_view__ = UserView


# TODO: PEP 695
UserIndexPage = ModelIndexPage[User]


class CurrentUserResponse(UserView):
    """
    Includes extra attributes relevant only to the current user
    """

    labs: LabIndexPage
    plans: ResearchPlanIndexPage

    @classmethod
    async def from_model(
        cls: type[CurrentUserResponse], model: User, **kwargs
    ) -> CurrentUserResponse:
        from api.lab.schemas import LabView, LabIndex
        from api.research.schemas import ResearchPlanIndex

        db = async_object_session(model)
        if not isinstance(db, LocalSession):
            raise RuntimeError("Model detached from session")

        lab_pages = LabIndex(select(Lab).where(Lab.supervisors.contains(model)))
        labs = await lab_pages.load_page(db, 0)

        coordinated_plans = select(ResearchPlan).where(
            ResearchPlan.coordinator == model
        )
        plan_pages = ResearchPlanIndex(
            select(ResearchPlan).where(ResearchPlan.coordinator == model)
        )
        plans = await plan_pages.load_page(db, 0)

        return await super().from_model(model, labs=labs, plans=plans)


class AlterPasswordRequest(ModelUpdateRequest[User]):
    current_value: str
    new_value: str
