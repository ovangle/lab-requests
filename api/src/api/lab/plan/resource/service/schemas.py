
from api.base.schemas import api_dataclass

from ..common.schemas import ResourceCostEstimate


@api_dataclass()
class Service:
    description: str

    contracted_to: str
    estimated_cost: ResourceCostEstimate | None