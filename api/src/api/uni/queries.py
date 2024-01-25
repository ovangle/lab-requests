from sqlalchemy import select, Select, or_

from db.models.uni import Campus


def query_campuses(
    code_eq: str | None = None,
    search: str | None = None,
) -> Select[tuple[Campus]]:
    clauses = []

    if code_eq is not None:
        return select(Campus).where(Campus.code == code_eq)

    if search:
        clauses.append(
            or_(Campus.name.ilike(f"%{search}%"), Campus.code.ilike(f"%{search}%"))
        )
    return select(Campus).where(*clauses)
