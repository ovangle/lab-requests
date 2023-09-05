from pydantic.dataclasses import dataclass

from api.base.schemas import api_dataclass

from ..common.schemas import Resource, ResourceCostEstimate, ResourceStorage
from ..common.types import DisposalType

@api_dataclass()
class OutputMaterial(Resource):
    # The base unit of consumption
    base_unit: str

    storage_description: str
    storage_cost: ResourceCostEstimate | None

    disposal_type: DisposalType
    disposal_cost: ResourceCostEstimate | None
