from typing import Optional
from sqlalchemy import Select, or_, select

from db.models.research import ResearchFunding

# TODO: Move to db.models


def query_funding_models(
    name_eq: str | None = None, text: str | None = None
) -> Select[tuple[ResearchFunding]]:
    clauses: list = []
    if name_eq is not None:
        clauses.append(ResearchFunding.name.ilike(f"%{name_eq}%"))

    if text is not None:
        clauses.append(
            or_(
                ResearchFunding.name.ilike(f"%{text}%"),
                ResearchFunding.description.ilike(f"%{text}%"),
            )
        )

    return select(ResearchFunding).where(*clauses)
