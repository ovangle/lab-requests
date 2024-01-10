from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import select, Select

from db.models.user import User

from api.lab.plan.queries import query_research_plans
from .schemas import WorkUnitView


def query_work_units(
    plan_id: UUID | None = None,
    researcher: User | None = None,
    supervisor: User | None = None,
) -> Select[tuple[WorkUnit]]:
    queries = []
    if plan_id:
        queries.append(models.WorkUnit_.plan_id == plan_id)
    if researcher_email or supervisor_email:
        subquery = query_research_plans(
            researcher_email=researcher_email, supervisor_email=supervisor_email
        )
        queries.append(
            models.WorkUnit_.plan_id.in_(
                subquery.select(plan_models.ExperimentalPlan_.id)
            )
        )
    if technician_email:
        queries.append(models.WorkUnit_.technician_email == technician_email)
    return select(models.WorkUnit_).where(*queries)
