
from sqlalchemy import select, Select, or_
from .models import Campus

def query_campuses(
    text_like: str | None = None
) -> Select[tuple[Campus]]:
    clauses = []
    if text_like:
        clauses.append(
            or_(
                Campus.name.ilike(f'%{text_like}%'),
                Campus.code.ilike(f'%{text_like}%')
            )
        )
    return select(Campus).where(*clauses)
