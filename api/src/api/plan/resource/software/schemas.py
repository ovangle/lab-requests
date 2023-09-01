from uuid import UUID
from pydantic.dataclasses import dataclass
from ..common.types import ResourceType


@dataclass()
class Software:
    type: ResourceType
    id: UUID

    name: str
    description: str

    min_version: str

    is_license_required: bool
    estimated_cost: float

