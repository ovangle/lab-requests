from typing import Optional
from sqlalchemy import Select, select

from .models import FundingModel


def query_funding_models(
    description_like: Optional[str] = None
) -> Select[tuple[FundingModel]]:
    clauses = []
    if description_like is not None:
        clauses.append(FundingModel.description.ilike(rf'%{description_like}%'))

    return select(FundingModel).where(*clauses)