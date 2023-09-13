from typing import Any
from uuid import UUID
from sqlalchemy import Select, distinct, select

from .models import ExperimentalPlan_
from api.lab.work_unit.models import WorkUnit_

def query_experimental_plans(
    researcher_email: str | None = None,
    supervisor_email: str | None = None,
    technician_email: str | None = None,
):
    queries = []
    if researcher_email:
        queries.append(ExperimentalPlan_.researcher_email == researcher_email)
    if supervisor_email:
        queries.append(ExperimentalPlan_.supervisor_email == supervisor_email)
    if technician_email:
        subquery = (
            select(ExperimentalPlan_.id)
            .join(WorkUnit_, WorkUnit_.plan_id == ExperimentalPlan_.id)
            .where(WorkUnit_.technician_email == technician_email)
        )

        queries.append(ExperimentalPlan_.id.in_(subquery))

    return select(ExperimentalPlan_).where(*queries)

    