from datetime import date, datetime
from typing import Any, Generic, TypeVar
from uuid import UUID

from db.models.lab.allocatable import Allocatable, LabAllocation, AllocationStatus, AllocationStatusTransition

from ..base_schemas import BaseModel, ModelDetail

TAllocation = TypeVar("TAllocation", bound=LabAllocation)

class LabAllocationDetail(ModelDetail[TAllocation], Generic[TAllocation]):
    type: str
    lab_id: UUID
    status: AllocationStatus

    start_date: date | None
    end_date: date | None

    request_at: datetime
    request_by_id: UUID

    consumer_type: str
    consumer_id: UUID

    all_requests: list[AllocationStatusTransition]

    approved_at: datetime | None
    approved_by_id: UUID | None
    is_approved: bool

    rejected_at: datetime | None
    rejected_by_id: UUID | None
    is_rejected: bool

    all_rejections: list[AllocationStatusTransition]

    denied_at: datetime | None
    denied_by_id: UUID | None
    is_denied: bool

    setup_begin_at: datetime | None
    setup_by_id: UUID | None

    prepared_at: datetime | None
    is_prepared: bool

    commenced_at: datetime | None
    commenced_by_id: UUID | None
    is_commenced: bool

    progress_events: list[AllocationStatusTransition]

    completed_at: datetime | None
    completed_by_id: UUID | None
    is_completed: bool

    cancelled_at: datetime | None
    cancelled_by_id: UUID | None
    is_cancelled: bool

    teardown_begin_at: datetime | None
    teardown_by_id: UUID | None

    is_finalised: bool
    finalised_at: datetime | None
    finalised_by_id: str | None

    @classmethod
    async def _from_lab_allocation(cls, model: LabAllocation[Any], **kwargs):
        return await cls._from_base(
            model,
            type=model.type,
            lab_id=model.lab_id,
            status=model.status,

            consumer_type=model.consumer_type,
            consumer_id=model.consumer_id,

            start_date=model.start_date,
            end_date=model.end_date,

            request_by_id=model.request_by_id,
            request_at=model.request_at,

            all_requests=model.requests,

            rejected_at=model.rejected_at,
            rejected_by_id=model.rejected_by_id,
            is_rejected=model.is_rejected,

            all_rejections=model.rejections,

            denied_at=model.denied_at,
            denied_by_id=model.denied_by_id,
            is_denied=model.is_denied,

            approved_at=model.approved_at,
            approved_by_id=model.approved_by_id,
            is_approved=model.is_approved,

            setup_at=model.setup_begin_at,
            setup_by_id=model.setup_by_id,

            commenced_at=model.commenced_at,
            commenced_by_id=model.commenced_by_id,
            is_commenced=model.is_commenced,

            progress_events=model.progress_events,

            completed_at=model.completed_at,
            completed_by_id=model.completed_by_id,
            is_completed=model.is_completed,

            cancelled_at=model.cancelled_at,
            cancelled_by_id=model.cancelled_by_id,
            is_cancelled=model.is_cancelled,

            teardown_begin_at=model.teardown_begin_at,
            teardown_by_id=model.teardown_by_id,

            is_finalised=model.is_finalised,
            finalised_at=model.finalised_at,
            finalised_by_id=model.finalised_by_id,
            **kwargs
        )

TAllocationDetail = TypeVar('TAllocationDetail', bound=LabAllocationDetail)
