from __future__ import annotations
import asyncio

from sqlalchemy import select

from db import local_object_session
from db.models.base import model_id
from db.models.user import User
from db.models.lab import Lab

from .user import UserDetail

from ..lab.lab import LabIndex, LabIndexPage
from ..research.plan import ResearchPlanIndex, ResearchPlanIndexPage


class CurrentUserDetail(UserDetail):
    """
    Includes extra attributes relevant only to the current user
    """

    supervised_labs: LabIndexPage
    plans: ResearchPlanIndexPage

    @classmethod
    async def from_model(cls, model: User) -> CurrentUserDetail:
        db = local_object_session(model)

        lab_index = LabIndex(supervised_by=model.id)
        supervised_labs = await lab_index.load_page(db)

        plan_index = ResearchPlanIndex(coordinator=model_id(model))
        plans = await plan_index.load_page(db)

        return await super()._from_user(model, supervised_labs=supervised_labs, plans=plans)
