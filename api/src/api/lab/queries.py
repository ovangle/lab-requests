from sqlalchemy import Select, or_, select
from db.models.lab import Lab
from db.models.uni import Discipline, Campus

from ..uni.queries import query_campuses


def query_labs(
    campus: Campus | None = None,
    discipline: Discipline | None = None,
    search: str | None = None,
) -> Select[tuple[Lab]]:
    clauses: list = []

    if campus:
        clauses.append(Lab.campus_id == campus.id)

    if discipline:
        clauses.append(Lab.discipline == discipline)

    if search:
        search_components = search.split(" ")

        clauses.append(
            or_(
                Lab.campus.in_(query_campuses(search=search)),
                *(Lab.discipline.ilike(s) for s in search_components)
            )
        )

    return select(Lab).where(*clauses)
