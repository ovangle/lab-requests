
from sqlalchemy import select, Select, or_

from api.uni.types import CampusCode
from .models import Campus

def query_campuses(
    code_eq: CampusCode | None = None,
    text_like: str | None = None
) -> Select[tuple[Campus]]:
    clauses = []

    if code_eq is not None:
        return select(Campus).where(Campus.code == code_eq)


    if text_like:
        clauses.append(
            or_(
                Campus.name.ilike(f'%{text_like}%'),
                Campus.code.ilike(f'%{text_like}%')
            )
        )
    return select(Campus).where(*clauses)
