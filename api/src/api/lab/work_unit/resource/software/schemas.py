from __future__ import annotations
from uuid import UUID

from fastapi import HTTPException
from ..common.schemas import ResourceParams, ResourceType, ResourceBase


class Software(ResourceBase):
    __resource_type__ = ResourceType.SOFTWARE

    name: str
    description: str
    min_version: str
    is_license_required: bool
    estimated_cost: float

    def __init__(self, container_id: UUID, index: int, params: SoftwareParams):
        super().__init__(container_id, index, params)
        self.name = params.name
        self.description = params.description
        self.min_version = params.min_version
        self.is_license_required = params.is_license_required
        self.estimated_cost = params.estimated_cost

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
    estimated_cost: float

