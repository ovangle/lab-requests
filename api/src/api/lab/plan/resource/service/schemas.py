
from ..common.schemas import ResourceCostEstimate, ResourceType, Resource


class Service(Resource):
    type: ResourceType = ResourceType.SERVICE
    description: str

    contracted_to: str
    estimated_cost: ResourceCostEstimate | None