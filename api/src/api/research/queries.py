from typing import Any
from uuid import UUID
from sqlalchemy import Select, distinct, select

from db.models.research import ResearchPlan
from db.models.user import User


def query_research_plans(
    researcher: User | None = None,
    coordinator: User | None = None,
):
    queries = []
    if researcher:
        queries.append(ResearchPlan.researcher_id == researcher.id)
    if coordinator:
        queries.append(ResearchPlan.coordinator_id == coordinator.id)

    return select(ResearchPlan).where(*queries)
