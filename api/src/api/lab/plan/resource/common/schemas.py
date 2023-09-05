from typing import Optional
from uuid import UUID
from pydantic.dataclasses import dataclass

from api.base.schemas import api_dataclass

from .types import ResourceDisposalType, ResourceStorageType

@api_dataclass()
class ResourceCostEstimate: 
    is_university_supplied: bool
    estimated_cost: float = 0

@api_dataclass()
class ResourceStorage:
    description: str
    estimated_cost: ResourceCostEstimate

@api_dataclass()
class Resource:
    plan_id: UUID
    index: int
