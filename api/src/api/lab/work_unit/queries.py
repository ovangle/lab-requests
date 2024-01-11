from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import select, Select
from db.models.lab.lab_work_unit import LabWorkUnit
from db.models.research.plan import ResearchPlan

from db.models.user import User

from api.lab.plan.queries import query_research_plans
from .schemas import WorkUnitView


def query_work_units(
    plan_id: UUID | None = None,
    coordinator: User | None = None,
    researcher: User | None = None,
    supervisor: User | None = None,
) -> Select[tuple[LabWorkUnit]]:
    clauses = []
    if plan_id:
        clauses.append(LabWorkUnit.plan_id == plan_id)
    if researcher or coordinator:
        subquery = query_research_plans(researcher=researcher, coordinator=coordinator)
        clauses.append(LabWorkUnit.plan_id.in_(subquery.select(ResearchPlan.id)))
    if supervisor:
        clauses.append(LabWorkUnit.supervisor_id == supervisor.id)
    return select(LabWorkUnit).where(*clauses)
