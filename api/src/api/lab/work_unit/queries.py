from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import select, Select

from api.lab.plan import models as plan_models
from api.lab.plan.queries import query_experimental_plans
from .schemas import WorkUnit
from . import models 


def query_work_units(
    plan_id: UUID | None = None,
    researcher_email: str | None = None,
    supervisor_email: str | None = None,
    technician_email: str | None = None,
) -> Select[tuple[models.WorkUnit_]]: 
    queries = []
    if plan_id:
        queries.append(models.WorkUnit_.plan_id == plan_id)
    if researcher_email or supervisor_email:
        subquery = query_experimental_plans(
            researcher_email=researcher_email,
            supervisor_email=supervisor_email
        )
        queries.append(
            models.WorkUnit_.plan_id.in_(subquery.select(plan_models.ExperimentalPlan_.id))
        )
    if technician_email:
        queries.append(models.WorkUnit_.technician_email == technician_email)
    return select(models.WorkUnit_).where(*queries)
