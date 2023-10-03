from uuid import UUID
from ..common.schemas import ResourceType, ResourceBase


class Software(ResourceBase):
    __resource_type__ = ResourceType.SOFTWARE

    id: UUID
    name: str
    description: str
    min_version: str
    is_license_required: bool
    estimated_cost: float

