from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Annotated, Any, ClassVar, TypedDict
from uuid import UUID
import warnings

from sqlalchemy import Dialect, types
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects import postgresql

from db import LocalSession
from db.models.base import ModelException
from db.models.base.state import StatusTransitionTypeDecorator
from db.models.user import User


class ProvisionStatus(Enum):
    # Request for some abstract unit of work to be done.
    REQUESTED = "requested"

    # The provision has been approved by the relevant manager
    APPROVED = "approved"

    # The provision request has been rejected, but can be edited and
    # resubmitted
    REJECTED = "rejected"

    # A denied provision cannot be resubmitted
    DENIED = "denied"

    # The provision has been purchased and is awaiting finalization
    PURCHASED = "purchased"
    # The provision has been successfully completed
    COMPLETED = "completed"

    # The provision was cancelled for some reason
    CANCELLED = "cancelled"

    @property
    def is_repeatable(self):
        repeatable_statuses = {
            ProvisionStatus.REQUESTED,
            ProvisionStatus.REJECTED,
        }
        return self in repeatable_statuses

    @property
    def is_pending(self):
        return self in [
            ProvisionStatus.REQUESTED,
            ProvisionStatus.REJECTED,
            ProvisionStatus.APPROVED,
            ProvisionStatus.PURCHASED,
        ]

    @property
    def is_final(self):
        return not self.is_pending


def repeatable_provision_status_metadata_column():
    return mapped_column(postgresql.ARRAY(postgresql.JSONB), server_default="{}")


PROVISION_STATUS_ENUM = postgresql.ENUM(
    ProvisionStatus, name="provision_status", create_type=False
)


class ProvisionTransition(TypedDict):
    provision_id: UUID
    status: ProvisionStatus
    at: datetime
    by_id: UUID
    note: str


def _provision_transition_from_json(json: dict):
    return ProvisionTransition(
        provision_id=UUID(hex=json["provision_id"]),
        status=json["status"],
        at=datetime.fromisoformat(json["at"]),
        by_id=UUID(hex=json["by_id"]),
        note=json["note"],
    )


def _provision_transition_to_json(metadata: ProvisionTransition):
    return {
        "provision_id": metadata["provision_id"].hex,
        "status": metadata["status"].value,
        "at": metadata["at"].isoformat(),
        "by_id": metadata["by_id"].hex,
        "note": metadata["note"],
    }


class PROVISION_STATUS_TRANSITION(StatusTransitionTypeDecorator[ProvisionStatus, ProvisionTransition]):
    def transition_from_json(self, json: dict[str, Any]):
        return _provision_transition_from_json(json)


    def transition_to_json(self, transition: ProvisionTransition):
        return _provision_transition_to_json(transition)

    def copy(self, **kw):
        return PROVISION_STATUS_TRANSITION(self.status, repeatable=self.repeatable)


class ProvisionStatusError(ModelException):
    def __init__(self, status: ProvisionStatus, next_status: ProvisionStatus, msg: str):
        self.status = status
        self.next_status = next_status
        prefix = f"provision status error {status.value} -> {next_status.value}: "
        msg = f"{prefix}{msg}"
        super().__init__(msg)
