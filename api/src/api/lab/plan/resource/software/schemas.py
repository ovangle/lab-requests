from uuid import UUID
from ..common.schemas import ResourceType, Resource


class Software(Resource):
    type: ResourceType = ResourceType.SOFTWARE
    id: UUID

    name: str
    description: str

    min_version: str

    is_license_required: bool
    estimated_cost: float

