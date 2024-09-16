from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any, TypedDict
from uuid import UUID

from sqlalchemy import Dialect, types
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import mapped_column

from enum import Enum

from db.models.base import ModelException


class AllocationStatus(Enum):
    REQUESTED = "requested"
    APPROVED = "approved"

    # The allocation has been rejected, but may be resubmitted
    REJECTED = "rejected"

    # The allocation is denied outright
    DENIED = "denied"

    SETUP = "setup"

    PREPARED = "prepared"

    IN_PROGRESS = "in_progress"

    COMPLETED = "completed"
    CANCELLED = "cancelled"

    TEARDOWN = "teardown"

    FINALISED = "finalised"

    @property
    def is_pending(self):
        return self not in {AllocationStatus.FINALISED, AllocationStatus.DENIED}

    @property
    def is_repeatable(self):
        return self in {
            AllocationStatus.REJECTED,
            AllocationStatus.REQUESTED,
            AllocationStatus.IN_PROGRESS,
        }

    @property
    def is_cancellable(self):
        cancellable_statuses = {
            AllocationStatus.APPROVED,
            AllocationStatus.SETUP,
            AllocationStatus.PREPARED,
            AllocationStatus.IN_PROGRESS,
            AllocationStatus.COMPLETED,
            AllocationStatus.TEARDOWN,
        }
        return self in cancellable_statuses


ALLOCATION_STATUS_ENUM = postgresql.ENUM(
    AllocationStatus, name="allocation_status", create_type=False
)


class AllocationStatusTransition(TypedDict):
    allocation_id: UUID
    status: AllocationStatus

    at: datetime
    by_id: UUID

    note: str


def _allocation_status_transition_from_json(json: dict):
    return AllocationStatusTransition(
        allocation_id=UUID(hex=json["allocation_id"]),
        status=json["status"],
        at=datetime.fromisoformat(json["at"]),
        by_id=UUID(hex=json["by_id"]),
        note=json["note"],
    )


def _allocation_status_transition_to_json(m: AllocationStatusTransition):
    return {
        "allocation_id": m["allocation_id"].hex,
        "status": str(m["status"]),
        "at": m["at"].isoformat(),
        "by_id": m["by_id"].hex,
        "note": m["note"],
    }


class ALLOCATION_STATUS_TRANSITION(types.TypeDecorator):
    impl = postgresql.JSONB()

    def __init__(self, status: AllocationStatus, *, repeatable: bool = False):
        self.status = status
        self.repeatable = repeatable

    def process_bind_param(
        self,
        value: list[AllocationStatusTransition] | AllocationStatusTransition | None,
        dialect: Dialect,
    ):
        if self.repeatable:
            if not isinstance(value, list):
                raise ModelException("non-repeatable status metadata")
            return [_allocation_status_transition_to_json(item) for item in value]
        if isinstance(value, dict) or value is None:
            if self.repeatable:
                raise ModelException("repeatable status metadata must have array value")
            return _allocation_status_transition_to_json(value) if value else None
        raise TypeError("Expected a list, dict or None")

    def process_result_value(self, value: list[dict] | dict | None, dialect: Dialect):
        if self.repeatable:
            if not isinstance(value, list):
                raise ModelException("expected a list of metadatas")
            return [_allocation_status_transition_from_json(m) for m in value]
        else:
            return (
                _allocation_status_transition_from_json(value)
                if isinstance(value, dict)
                else None
            )

    def copy(self, **kw):
        return ALLOCATION_STATUS_TRANSITION(self.status, repeatable=self.repeatable)


class AllocationStatusError(ValueError):
    def __init__(
        self,
        status: AllocationStatus,
        next_status: AllocationStatus,
        msg: str | None = None,
    ):
        self.status = status
        self.next_status = next_status
        prefix_msg = (
            f"status transition not allowed: {status.value} -> {next_status.value}"
        )
        msg = f"{prefix_msg}: {msg or ''}"
        super().__init__(msg)
