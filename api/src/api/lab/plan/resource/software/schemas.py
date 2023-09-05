from uuid import UUID
from api.base.schemas import api_dataclass
from ..common.types import ResourceType


@api_dataclass()
class Software:
    type: ResourceType
    id: UUID

    name: str
    description: str

    min_version: str

    is_license_required: bool
    estimated_cost: float

