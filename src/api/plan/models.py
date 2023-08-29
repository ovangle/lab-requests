from datetime import datetime
from pydantic.dataclasses import dataclass
from sqlalchemy import UUID

from api.uni.models import Campus
from .types import ExperimentalPlanType

@dataclass(kw_only=True)
class ExperimentalPlan:
    id: UUID
    type: ExperimentalPlanType
    other_type_description: str

    campus: Campus

    process_summary: str

    created_by: str
    created_at: datetime
    updated_at: datetime

