from __future__ import annotations
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import HTTPException

from api.lab.work_unit.resource.models import ResourceContainer_
from ..common.schemas import ResourceCostEstimate, ResourceParams, ResourceType, ResourceBase


class Software(ResourceBase):
    __resource_type__ = ResourceType.SOFTWARE

    name: str
    description: str
    min_version: str
    is_license_required: bool
    estimated_cost: ResourceCostEstimate | None

    @classmethod
    def create(cls, container: ResourceContainer_ | UUID, index: int, params: ResourceParams[Software]):
        if not isinstance(params, SoftwareParams):
            raise TypeError('Expected software params')

        return cls(
            container_id=container if isinstance(container, UUID) else container.id,
            id=params.id or uuid4(),
            index=index,
            name=params.name,
            description=params.description,
            min_version=params.min_version,
            is_license_required=params.is_license_required,
            estimated_cost=params.estimated_cost,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

    def apply(self, params: ResourceParams[Software]):
        params = SoftwareParams(**params.model_dump())
        if self.name != params.name:
            raise HTTPException(409, 'Cannot update software name')
        self.description = params.description
        self.min_version = params.min_version
        self.is_license_required = params.is_license_required
        self.estimated_cost = params.estimated_cost
        return super().apply(params)


class SoftwareParams(ResourceParams[Software]):
    name: str
    description: str
    min_version: str
    is_license_required: bool
    estimated_cost: ResourceCostEstimate | None = None

