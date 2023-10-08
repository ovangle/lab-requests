from __future__ import annotations
from datetime import datetime
from typing import Any, Literal
from uuid import UUID, uuid4
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

    @classmethod
    def from_model(cls, model: dict[str, Any]):
        return cls(**model)

    @classmethod
    def create(cls, container_id: UUID, index: int, params: InputMaterialParams):
        return cls(
            container_id=container_id,
            id=params.id or uuid4(),
            index=index,
            base_unit=params.base_unit,
            per_unit_cost_estimate=params.per_unit_cost_estimate,
            num_units_required = params.num_units_required,
            hazard_classes = params.hazard_classes,
            storage = params.storage,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

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