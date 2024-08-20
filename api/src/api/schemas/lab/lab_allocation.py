from typing import Generic, TypeVar
from uuid import UUID

from db.models.lab.allocatable import Allocatable, LabAllocation

from ..base import BaseModel, ModelDetail

TAllocatable = TypeVar("TAllocatable", bound=Allocatable)


class LabAllocationDetail(ModelDetail[LabAllocation], Generic[TAllocatable]):
    lab_id: UUID

    @classmethod
    async def from_base(cls, model: LabAllocation[TAllocatable]):
        return cls(
            id=model.id,
            lab_id=model.lab_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
