from datetime import datetime
from enum import Enum
from typing import Annotated, TypedDict
from uuid import UUID
import warnings

from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects import postgresql

from db import LocalSession
from db.models.user import User


class ProvisionStatus(Enum):
    # Request for some abstract unit of work to be done.
    REQUESTED = "requested"
    # The provision has been approved by the relevant manager
    APPROVED = "approved"
    # The provision has been purchased and is awaiting finalization
    PURCHASED = "purchased"
    # The provision has been successfully completed
    COMPLETED = "completed"

    # The provision was cancelled for some reason
    CANCELLED = "cancelled"

    @property
    def is_pending(self):
        return self in [
            ProvisionStatus.REQUESTED,
            ProvisionStatus.APPROVED,
            ProvisionStatus.PURCHASED,
        ]

    @property
    def is_final(self):
        return not self.is_pending


PROVISION_STATUS_TYPE = postgresql.ENUM(
    ProvisionStatus, name="provision_status", create_type=False
)

provision_status = Annotated[
    ProvisionStatus, mapped_column(PROVISION_STATUS_TYPE, index=True)
]


class ProvisionStatusMetadata(TypedDict):
    provision_id: UUID
    status: ProvisionStatus
    at: datetime
    by_id: UUID
    note: str


def _provision_status_metadata_from_json(json: dict):
    return ProvisionStatusMetadata(
        provision_id=UUID(hex=json["provision_id"]),
        status=json["status"],
        at=datetime.fromisoformat(json["at"]),
        by_id=UUID(hex=json["by_id"]),
        note=json["note"],
    )


def _provision_status_metadata_to_json(metadata: ProvisionStatusMetadata):
    return {
        "provision_id": metadata["provision_id"].hex,
        "status": metadata["status"].value,
        "at": metadata["at"].isoformat(),
        "by_id": metadata["by_id"].hex,
        "note": metadata["note"],
    }


provision_status_metadatas = Annotated[
    ProvisionStatusMetadata, mapped_column(postgresql.JSONB, server_default="{}")
]


def provision_status_metadata_property(metadatas_col: str, status: ProvisionStatus):
    def getter(self) -> ProvisionStatusMetadata | None:
        metadatas = getattr(self, metadatas_col, {})
        if not isinstance(metadatas, dict):
            raise TypeError(f"Expected a map of metadatas")

        try:
            return _provision_status_metadata_from_json(
                self._provision_status_metadatas[status.value]
            )
        except KeyError:
            return None

    def setter(self, metadata: ProvisionStatusMetadata | None):
        metadatas = getattr(self, metadatas_col, {})

        if not metadata:
            raise ValueError("Cannot delete existing metadata stamp")

        if metadata["status"] != status:
            raise ValueError(
                f"Cannot assign {metadata['status']!s} metadata to '{status!s}' property"
            )

        if status in metadatas:
            warnings.warn("Reassigning '{status.value}' provision")

        metadata_json = _provision_status_metadata_to_json(metadata)
        self._provision_status_metadatas[status.value] = metadata_json

    return property(getter, setter)
