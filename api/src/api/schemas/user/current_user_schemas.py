from __future__ import annotations
import asyncio

from sqlalchemy import select

from db import local_object_session
from db.models.base import model_id
from db.models.lab.lab import query_labs
from db.models.research.plan import query_research_plans
from db.models.user import User
from db.models.lab import Lab

from .user import UserDetail

from ..lab.lab import LabDetail, LabIndexPage
from ..research.plan import ResearchPlanDetail, ResearchPlanIndexPage


class CurrentUserDetail(UserDetail):
    """
    Includes extra attributes relevant only to the current user
    """

    supervised_labs: LabIndexPage
    plans: ResearchPlanIndexPage

    @classmethod
    async def from_model(cls, model: User) -> CurrentUserDetail:
        db = local_object_session(model)

        supervised_labs = await LabIndexPage.from_selection(
            db,
            query_labs(supervised_by=model.id),
        )

        plans = await ResearchPlanIndexPage.from_selection(
            db,
            query_research_plans(coordinator=model_id(model)),
        )

        return await super()._from_user(model, supervised_labs=supervised_labs, plans=plans)
