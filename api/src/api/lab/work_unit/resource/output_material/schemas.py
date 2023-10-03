from __future__ import annotations

from uuid import UUID
from fastapi import HTTPException
from pydantic.dataclasses import dataclass

from ..common.schemas import ResourceBase, ResourceParams, ResourceStorage, ResourceDisposal, ResourceType

class OutputMaterial(ResourceBase):
    __resource_type__ = ResourceType.OUTPUT_MATERIAL
    # The base unit of consumption
    base_unit: str

    storage: ResourceStorage | None
    disposal: ResourceDisposal | None

    def __init__(self, container_id: UUID, index: int, params: OutputMaterialParams):
        super().__init__(container_id, index, params)
        self.base_unit = params.base_unit
        self.storage = params.storage
        self.disposal = params.disposal

    def apply(self, params: ResourceParams[OutputMaterial]):
        params = OutputMaterialParams(**params.model_dump())
        if self.base_unit != params.base_unit:
            raise HTTPException(409, 'Cannot update base unit of output-material')

        self.storage = params.storage
        self.disposal = params.disposal
        return super().apply(params)


class OutputMaterialParams(ResourceParams[OutputMaterial]):
    base_unit: str
    storage: ResourceStorage | None = None
    disposal: ResourceDisposal | None = None
