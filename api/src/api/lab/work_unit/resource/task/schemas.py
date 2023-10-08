from __future__ import annotations
from datetime import datetime
from uuid import UUID, uuid4

from api.lab.work_unit.resource.models import ResourceContainer_

from ..common.schemas import ResourceCostEstimate, ResourceParams, ResourceType, ResourceBase


class Task(ResourceBase):
    __resource_type__ = ResourceType.TASK

    description: str

    contracted_to: str | None
    estimated_cost: ResourceCostEstimate | None

    @classmethod
    def create(cls, container: ResourceContainer_ | UUID, index: int, params: ResourceParams[Task]) -> Task:
        if not isinstance(params, TaskParams):
            raise ValueError('Expected task params')
        return cls(
            container_id=container if isinstance(container, UUID) else container.id,
            index=index,
            id=params.id or uuid4(),
            description=params.description,
            contracted_to=params.contracted_to,
            estimated_cost=params.estimated_cost,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )


class TaskParams(ResourceParams[Task]):
    description: str
    contracted_to: str | None = None
    estimated_cost: ResourceCostEstimate | None = None