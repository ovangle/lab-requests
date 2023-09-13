from typing import Optional
from sqlalchemy import Select, select

from .models import FundingModel_


def query_funding_models(
    description_like: Optional[str] = None
) -> Select[tuple[FundingModel_]]:
    clauses = []
    if description_like is not None:
        clauses.append(FundingModel_.description.ilike(rf'%{description_like}%'))

    return select(FundingModel_).where(*clauses)