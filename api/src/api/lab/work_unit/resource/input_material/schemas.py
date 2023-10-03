from typing import Literal

from ..common.schemas import ResourceCostEstimate, HazardClass, ResourceBase, ResourceStorage, ResourceType

class InputMaterial(ResourceBase):
    __resource_type__ = ResourceType.INPUT_MATERIAL

    base_unit: str

    per_unit_cost_estimate: ResourceCostEstimate | None
    num_units_required: int 

    hazard_classes: list[HazardClass]

    storage: ResourceStorage | None = None
