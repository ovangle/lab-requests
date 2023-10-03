
from ..common.schemas import ResourceCostEstimate, ResourceType, ResourceBase


class Task(ResourceBase):
    __resource_type__ = ResourceType.TASK

    description: str

    contracted_to: str | None
    estimated_cost: ResourceCostEstimate | None