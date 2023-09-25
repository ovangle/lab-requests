
from ..common.schemas import ResourceCostEstimate, ResourceType, Resource


class Service(Resource):
    type: ResourceType = ResourceType.SERVICE
    description: str

    contracted_to: str | None
    estimated_cost: ResourceCostEstimate | None