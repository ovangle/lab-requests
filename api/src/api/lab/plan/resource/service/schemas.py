
from api.base.schemas import api_dataclass

from ..common.schemas import ResourceCostEstimate, ResourceType


@api_dataclass()
class Service:
    type: ResourceType = ResourceType.SERVICE
    description: str

    contracted_to: str
    estimated_cost: ResourceCostEstimate | None