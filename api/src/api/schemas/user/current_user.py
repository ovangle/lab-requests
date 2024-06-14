from __future__ import annotations

from sqlalchemy import select

from db import local_object_session
from db.models.user import User
from db.models.lab import Lab
from db.models.research import ResearchPlan

from .user import UserView
from ...lab.schemas import LabIndex, LabIndexPage
from ...research.schemas import ResearchPlanIndex, ResearchPlanIndexPage


class CurrentUserView(UserView):
    """
    Includes extra attributes relevant only to the current user
    """

    labs: LabIndexPage
    plans: ResearchPlanIndexPage

    @classmethod
    async def from_model(
        cls: type[CurrentUserView], model: User, **kwargs
    ) -> CurrentUserView:
        db = local_object_session(model)

        lab_pages = LabIndex(select(Lab).where(Lab.supervisors.contains(model)))
        labs = await lab_pages.load_page(db, 1)

        plan_pages = ResearchPlanIndex(
            select(ResearchPlan).where(ResearchPlan.coordinator == model)
        )
        plans = await plan_pages.load_page(db, 1)

        return await super().from_model(model, labs=labs, plans=plans)
