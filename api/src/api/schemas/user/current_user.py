from __future__ import annotations
import asyncio

from sqlalchemy import select

from db import local_object_session
from db.models.user import User
from db.models.lab import Lab
from db.models.research import ResearchPlan

from .user import UserDetail

from ..lab.lab import LabDetail
from ..research.plan import ResearchPlanDetail


class CurrentUserDetail(UserDetail):
    """
    Includes extra attributes relevant only to the current user
    """

    labs: list[LabDetail]
    plans: list[ResearchPlanDetail]

    @classmethod
    async def from_model(cls, model: User) -> CurrentUserDetail:
        db = local_object_session(model)

        supervised_labs = await db.scalars(
            select(Lab).where(Lab.supervisors.contains(model))
        )

        labs = await asyncio.gather(
            *(LabDetail.from_model(lab) for lab in supervised_labs)
        )

        coordinated_plans = await db.scalars(
            select(ResearchPlan).where(ResearchPlan.coordinator == model)
        )
        plans = await asyncio.gather(
            *(ResearchPlanDetail.from_model(plan) for plan in coordinated_plans)
        )

        return await super()._from_user(model, labs=labs, plans=plans)
