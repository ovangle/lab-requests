from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, TypedDict
from uuid import UUID

from sqlalchemy.dialects import postgresql

from db.models.base import ModelException
from db.models.base.state import StatusTransitionTypeDecorator, TransitionMeta, transition_meta_from_json, transition_meta_to_json


class WorkStatus(Enum):
    # The work has been created, but the associated provision
    # cannot proceed
    CREATED = "created"
    # Anything blocking the provision has been removed and the
    # work is ready to commence
    READY = "ready"
    # Someone has started working on it
    COMMENCED = "commenced"

    COMPLETED = "completed"


WORK_STATUS_ENUM = postgresql.ENUM(
    WorkStatus, name="lab_work_status", create_type=False
)


class WorkStatusTransition(TransitionMeta[WorkStatus]):
    work_id: UUID


class WORK_STATUS_TRANSITION(StatusTransitionTypeDecorator[WorkStatus, WorkStatusTransition]):
    def transition_from_json(self, json: dict):
        return WorkStatusTransition(
            **transition_meta_from_json(self.status, json),
            work_id=UUID(json["work_id"])
        )

    def transition_to_json(self, transition: WorkStatusTransition) -> dict[str, Any]:
        return {
            **transition_meta_to_json(transition),
            "work_id": str(transition["work_id"])
        }


class WorkStatusError(ModelException):
    def __init__(self, status: WorkStatus, next_status: WorkStatus, message: str):
        self.status = status
        self.next_status = next_status
        super().__init__(
            f"invalid transition {status.value} -> {next_status.value}: {message}"
        )
