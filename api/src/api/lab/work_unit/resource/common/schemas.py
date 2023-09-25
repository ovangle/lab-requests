from __future__ import annotations
from datetime import datetime
from enum import Enum
import re
from typing import TYPE_CHECKING, Any, Literal
from uuid import UUID

from pydantic import BaseModel, GetCoreSchemaHandler
from pydantic_core import core_schema

if TYPE_CHECKING:
    from api.lab.plan.schemas import ExperimentalPlan
    from api.lab.work_unit.schemas import WorkUnit

class ResourceType(Enum):
    EQUIPMENT = 'equipment'
    SOFTWARE = 'software'
    SERVICE = 'service'
    INPUT_MATERIAL = 'input-material'
    OUTPUT_MATERIAL = 'output-material'

class HazardClass(str):
    RE = re.compile(r'(?P<group>\d+)(?P<class>\.\d+)?')

    def __new__(cls, value: str | HazardClass):
        if isinstance(value, HazardClass):
            return value
        if not HazardClass.RE.match(value):
            raise ValueError('Invalid Hazard class. Must match ') 

        return super().__new__(cls, value)

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: GetCoreSchemaHandler):
        return core_schema.no_info_after_validator_function(cls, handler(str))

    
class ResourceCostEstimate(BaseModel): 
    is_university_supplied: bool
    estimated_cost: float = 0

class ResourceStorage(BaseModel):
    description: str
    estimated_cost: ResourceCostEstimate | None

class ResourceDisposal(BaseModel):
    description: str
    estimated_cost: ResourceCostEstimate | None

class Resource(BaseModel):
    plan_id: UUID | None = None
    work_unit_id: UUID | None = None
    index: int | Literal['create'] = 'create'

    created_at: datetime | None = None
    updated_at: datetime | None = None
