from typing import Any
from uuid import UUID
from sqlalchemy import Select, distinct, select

from db.models.research import ResearchPlan
from db.models.research.funding import ResearchFunding
from db.models.user import User


def query_research_plans(
    researcher: str | None = None,
    coordinator: str | None = None,
):
    queries = []
    if researcher:
        queries.append(ResearchPlan.researcher_id == researcher)

    if coordinator:
        queries.append(ResearchPlan.coordinator_id == coordinator)

    return select(ResearchPlan).where(*queries)


def query_research_fundings(name_eq: str | None = None):
    clauses = []
    if name_eq:
        clauses.append(ResearchFunding.name == name_eq)

    return select(ResearchFunding).where(*clauses)
