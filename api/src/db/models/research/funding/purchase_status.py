from enum import Enum
from typing import Any
from uuid import UUID


from sqlalchemy.dialects import postgresql

from db.models.base.errors import ModelException
from db.models.base.state import StatusTransitionTypeDecorator, TransitionMeta, transition_meta_from_json, transition_meta_to_json

class PurchaseStatus(Enum):
    ORDERED = "ordered"

    READY = "ready"

    PAID = "paid"
    REVIEWED = "reviewed"

PURCHASE_STATUS_ENUM = postgresql.ENUM(
    PurchaseStatus, name="research_purchase_status", create_type=False
)

class PurchaseStatusTransition(TransitionMeta[PurchaseStatus]):
        budget_id: UUID
        purchase_id: UUID

def purchase_status_transition_to_json(
    transition: PurchaseStatusTransition
):
    return {
        **transition_meta_to_json(transition),
        "budget_id": str(transition["budget_id"]),
        "purchase_id": str(transition["purchase_id"])
    }

async def purchase_status_transition_from_json(
    status: PurchaseStatus,
    json: dict[str, Any]
):
    base: TransitionMeta[PurchaseStatus] = transition_meta_from_json(
        status,
        json
    )
    return PurchaseStatusTransition(
        **base,
        budget_id=UUID(json["budget_id"]),
        purchase_id=UUID(json["purchase_id"]),
    )

class PURCHASE_STATUS_TRANSITION(StatusTransitionTypeDecorator[PurchaseStatus, PurchaseStatusTransition]):
    def transition_from_json(self, json: dict[str, Any]):
        return purchase_status_transition_from_json(self.status, json)

    def transition_to_json(self, transition: PurchaseStatusTransition) -> dict[str, Any]:
        return purchase_status_transition_to_json(transition)


class PurchaseStatusError(ModelException):
    def __init__(self, status: PurchaseStatus, next_status: PurchaseStatus, message: str):
        self.status = status
        self.next_status = next_status

        prefix = f"invalid status transition ({self.status!s} - {self.next_status!s})"
        message = f"{prefix}: {message}"

        super().__init__(message)