from abc import abstractmethod
from datetime import datetime
from enum import Enum
from typing import Callable, Generic, TypeVar, TypedDict
from uuid import UUID

from sqlalchemy import Dialect, TypeDecorator
from sqlalchemy.dialects import postgresql

from db.models.base.errors import ModelException


TStatus = TypeVar("TStatus", bound=Enum)


class TransitionMeta(TypedDict, Generic[TStatus]):
    status: TStatus
    at: datetime
    by_id: UUID
    note: str


def _transition_meta_to_json(meta: TransitionMeta):
    return dict(
        status=str(meta["status"]),
        at=meta["at"].isoformat(),
        by_id=str(meta["by_id"]),
        note=meta["note"],
    )


def _transition_meta_from_json(status: TStatus, json: dict) -> TransitionMeta[TStatus]:
    if json["status"] != status:
        raise ValueError("Unexpected status in json")

    return TransitionMeta(
        status=status,
        at=datetime.fromisoformat(json["at"]),
        by_id=UUID(json["by_id"]),
        note=json["note"],
    )


TMeta = TypeVar("TMeta", bound=TransitionMeta)


class StatusTransitionTypeDecorator(TypeDecorator, Generic[TStatus]):
    impl = postgresql.JSONB

    def __init__(self, status: TStatus, repeatable: bool = False):
        """
        status: The target status of the transition that was performed.
        repeatable:
            Whether this status can be arrived at multiple times
            during the lifecycle of the state machine

            repeatable values are treated as json arrays
            non-repeatable statuses contain a nullable json object.
        """
        self.status = status
        self.repeatable = repeatable

    def process_bind_param(
        self,
        value: list[TransitionMeta[TStatus]] | TransitionMeta[TStatus] | None,
        dialect: Dialect,
    ):
        if value is None:
            return [] if self.repeatable else None

        if self.repeatable:
            if not isinstance(value, list):
                raise ModelException("non-repeatable status metadata")
            return [_transition_meta_to_json(item) for item in value]

        if isinstance(value, dict) or value is None:
            if self.repeatable:
                raise ModelException("repeatable status metadata must have array value")
            return _transition_meta_to_json(value) if value else None

        raise TypeError("Expected a list, dict or None")

    def process_result_value(self, value: list[dict] | dict | None, dialect: str):
        if self.repeatable:
            if not isinstance(value, list):
                raise ValueError("expected a list of metadatas")
            return [_transition_meta_from_json(self.status, item) for item in value]
        else:
            return (
                _transition_meta_from_json(self.status, value)
                if isinstance(value, dict)
                else None
            )
