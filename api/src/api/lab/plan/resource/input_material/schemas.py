from typing import Literal

from api.base.schemas import api_dataclass
from ..common.schemas import ResourceCostEstimate, HazardClass

@api_dataclass()
class InputMaterial:
    base_unit: str

    estimated_cost_per_unit: ResourceCostEstimate | None
    estimated_quantity_required: int | Literal['*']

    hazard_classes: list[HazardClass]

    storage_description: str
    storage_cost: ResourceCostEstimate | None
