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
    PagedModelResponse,
    ModelResponsePage,
)


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


UserRef = UserLookup | UUID


async def lookup_user(db: LocalSession, ref: UserRef):
    if isinstance(ref, UUID):
        ref = UserLookup(id=ref)
    return await ref.get(db)


class CurrentUserResponse(UserView):
    """
    Includes extra attributes relevant only to the current user
    """

    labs: ModelResponsePage[Lab]
    plans: ModelResponsePage[ResearchPlan]

    @classmethod
    async def from_model(
        cls: type[CurrentUserResponse], model: User, **kwargs
    ) -> CurrentUserResponse:
        from api.lab.schemas import LabView
        from api.research.schemas import ResearchPlanResponse

        db = async_object_session(model)
        if db is None:
            raise RuntimeError("Model detached from session")

        supervised_labs = select(Lab).where(Lab.supervisors.contains(model))
        lab_pages = PagedModelResponse(db, LabView, supervised_labs)
        labs = await lab_pages.load_page(0)

        coordinated_plans = select(ResearchPlan).where(
            ResearchPlan.coordinator == model
        )
        plan_pages = PagedModelResponse(db, ResearchPlanResponse, coordinated_plans)
        plans = await plan_pages.load_page(0)

        return await super().from_model(model, labs=labs, plans=plans)


class AlterPasswordRequest(ModelUpdateRequest[User]):
    current_value: str
    new_value: str
