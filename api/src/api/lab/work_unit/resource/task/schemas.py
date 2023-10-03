from __future__ import annotations
from uuid import UUID

from ..common.schemas import ResourceCostEstimate, ResourceParams, ResourceType, ResourceBase


class Task(ResourceBase):
    __resource_type__ = ResourceType.TASK

    description: str

    contracted_to: str | None
    estimated_cost: ResourceCostEstimate | None

    def __init__(self, container_id: UUID, index: int, params: TaskParams):
        super().__init__(container_id, index, params)
        self.description = params.description
        self.contracted_to = params.contracted_to
        self.estimated_cost = params.estimated_cost


class TaskParams(ResourceParams[Task]):
    description: str
    contracted_to: str | None = None
    estimated_cost: ResourceCostEstimate | None = None