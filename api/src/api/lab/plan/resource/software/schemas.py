from uuid import UUID
from api.base.schemas import api_dataclass
from ..common.schemas import ResourceType


@api_dataclass()
class Software:
    type: ResourceType = ResourceType.SOFTWARE
    id: UUID

    name: str
    description: str

    min_version: str

    is_license_required: bool
    estimated_cost: float

