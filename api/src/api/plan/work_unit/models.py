from datetime import datetime
from typing import Optional
from pydantic.dataclasses import dataclass
from uuid import UUID
from ..resource.models import ResourceContainer

from .types import LabType

@dataclass(kw_only=True)
class WorkUnit(ResourceContainer):
    id: UUID
    lab_type: LabType

    technician: str

    summary: str

    start_date: Optional[datetime]
    end_date: Optional[datetime]

    created_by: str
    created_at: datetime
    updated_at: datetime
