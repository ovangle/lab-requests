from __future__ import annotations
from enum import Enum
import re
from typing import Optional
from uuid import UUID
from pydantic.dataclasses import dataclass
from api.base.schemas import api_dataclass

class ResourceType(Enum):
    EQUIPMENT = 'equipment'
    SOFTWARE = 'software'
    SERVICE = 'service'
    INPUT_MATERIAL = 'input-material'
    OUTPUT_MATERIAL = 'output-material'

class HazardClass(str):
    RE = re.compile(r'(?<group>\d+)(?<class>\.\d+)?')

    def __new__(cls, value: str | HazardClass):
        if isinstance(value, HazardClass):
            return value
        if not HazardClass.RE.match(value):
            raise ValueError('Invalid Hazard class. Must match ') 

        return super().__new__(cls, value)

    
@api_dataclass()
class ResourceCostEstimate: 
    is_university_supplied: bool
    estimated_cost: float = 0

@api_dataclass()
class ResourceStorage:
    description: str
    estimated_cost: ResourceCostEstimate | None

@api_dataclass()
class ResourceDisposal:
    description: str
    estimated_cost: ResourceCostEstimate | None

@api_dataclass()
class Resource:
    plan_id: UUID
    index: int
