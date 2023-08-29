from typing import Optional
from pydantic.dataclasses import dataclass

from .types import ResourceDisposalType, ResourceStorageType

@dataclass(kw_only=True)
class ResourceDisposal:
    type: ResourceDisposalType
    other_description: Optional[str] = None

    estimated_cost: float = 0

@dataclass(kw_only=True)
class ResourceStorage:
    type: ResourceStorageType
    other_description: Optional[str] = None

    estimated_cost: float = 0

