from typing import Any
from uuid import UUID
from sqlalchemy import Select, distinct, select

from .models import ExperimentalPlan, WorkUnit

def query_experimental_plans(
    researcher_email: str | None = None,
    supervisor_email: str | None = None,
    technician_email: str | None = None,
):
    queries = []
    if researcher_email:
        queries.append(ExperimentalPlan.researcher_email == researcher_email)
    if supervisor_email:
        queries.append(ExperimentalPlan.supervisor_email == supervisor_email)
    if technician_email:
        subquery = (
            select(ExperimentalPlan.id)
            .join(WorkUnit, WorkUnit.plan_id == ExperimentalPlan.id)
            .where(WorkUnit.technician_email == technician_email)
        )

        queries.append(ExperimentalPlan.id.in_(subquery))

    return select(ExperimentalPlan).where(*queries)

def query_work_units(
    plan_id: UUID | None = None,
    researcher_email: str | None = None,
    supervisor_email: str | None = None,
    technician_email: str | None = None,
): 
    queries = []
    if plan_id:
        queries.append(WorkUnit.plan_id == plan_id)
    if researcher_email or supervisor_email:
        subquery = query_experimental_plans(
            researcher_email=researcher_email,
            supervisor_email=supervisor_email
        )
        queries.append(WorkUnit.plan_id.in_(subquery.select(ExperimentalPlan.id)))
    if technician_email:
        queries.append(WorkUnit.tecnician_email == technician_email)
    return select(WorkUnit).where(*queries)

    