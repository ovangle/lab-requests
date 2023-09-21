from typing import Optional
from sqlalchemy import Select, or_, select

from .models import FundingModel_


def query_funding_models(
    name_eq: str | None = None,
    text: str | None = None
) -> Select[tuple[FundingModel_]]:
    clauses = []
    if name_eq is not None:
        clauses.append(FundingModel_.name == name_eq)
    
    if text is not None:
        clauses.append(or_(
            FundingModel_.name.ilike(f'%{text}%'),
            FundingModel_.description.ilike(f'%{text}%')
        ))

    return select(FundingModel_).where(*clauses)