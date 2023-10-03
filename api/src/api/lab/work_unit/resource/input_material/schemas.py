from __future__ import annotations
from typing import Literal
from uuid import UUID
from fastapi import HTTPException
from pydantic import Field

from ..common.schemas import ResourceCostEstimate, HazardClass, ResourceBase, ResourceParams, ResourceStorage, ResourceType

class InputMaterial(ResourceBase):
    __resource_type__ = ResourceType.INPUT_MATERIAL

    base_unit: str

    per_unit_cost_estimate: ResourceCostEstimate | None
    num_units_required: int 

    hazard_classes: list[HazardClass]

    storage: ResourceStorage | None = None

    def __init__(self, container_id: UUID, index: int, params: InputMaterialParams):
        super().__init__(container_id, index, params)
        self.base_unit = params.base_unit

        self.per_unit_cost_estimate = params.per_unit_cost_estimate
        self.num_units_required = params.num_units_required
        self.hazard_classes = params.hazard_classes
        self.storage = params.storage

    def apply(self, params: ResourceParams[InputMaterial]):
        params = InputMaterialParams(**params.model_dump())

        if self.base_unit != params.base_unit:
            raise HTTPException(409, 'Cannot update baseUnit of ')
        self.per_unit_cost_estimate = params.per_unit_cost_estimate
        self.num_units_required = params.num_units_required
        self.hazard_classes = params.hazard_classes
        self.storage = params.storage
        
        return super().apply(params)

class InputMaterialParams(ResourceParams[InputMaterial]):
    base_unit: str

    per_unit_cost_estimate: ResourceCostEstimate | None = None
    num_units_required: int = 1

    hazard_classes: list[HazardClass] = Field(default_factory=list)
    storage: ResourceStorage | None = None