from __future__ import annotations
from datetime import datetime

from uuid import UUID, uuid4
from fastapi import HTTPException
from pydantic.dataclasses import dataclass

from api.lab.work_unit.resource.models import ResourceContainer_

from ..common.schemas import (
    ResourceBase,
    ResourceParams,
    ResourceStorage,
    ResourceDisposal,
    ResourceType,
)


class OutputMaterial(ResourceBase):
    __resource_type__ = ResourceType.OUTPUT_MATERIAL
    # The base unit of consumption
    base_unit: str

    storage: ResourceStorage | None
    disposal: ResourceDisposal | None

    @classmethod
    def create(
        cls, container: ResourceContainer_ | UUID, index: int, params: ResourceParams
    ):
        if not isinstance(params, OutputMaterialParams):
            raise TypeError("Expected OutputMaterialParams instance")

        return cls(
            container_id=container if isinstance(container, UUID) else container.id,
            index=index,
            id=params.id or uuid4(),
            base_unit=params.base_unit,
            storage=params.storage,
            disposal=params.disposal,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

    def apply(self, params: ResourceParams):
        params = OutputMaterialParams(**params.model_dump())
        if self.base_unit != params.base_unit:
            raise HTTPException(409, "Cannot update base unit of output-material")

        self.storage = params.storage
        self.disposal = params.disposal
        return super().apply(params)


class OutputMaterialParams(ResourceParams):
    base_unit: str
    storage: ResourceStorage | None = None
    disposal: ResourceDisposal | None = None
