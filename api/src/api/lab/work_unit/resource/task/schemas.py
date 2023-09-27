
from ..common.schemas import ResourceCostEstimate, ResourceType, ResourceBase


class Task(ResourceBase):
    type: ResourceType = ResourceType.TASK
    description: str

    contracted_to: str | None
    estimated_cost: ResourceCostEstimate | None