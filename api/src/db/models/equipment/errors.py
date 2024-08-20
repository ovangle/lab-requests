from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from db.models.base import DoesNotExist, ModelException
from db.models.lab import Lab
from db.models.lab.installable.errors import LabInstallationDoesNotExist

if TYPE_CHECKING:
    from .equipment import Equipment


class EquipmentDoesNotExist(DoesNotExist):
    def __init__(self, *, for_id: UUID | None):
        super().__init__("Equipment", for_id=for_id)


class EquipmentInstallationDoesNotExist(LabInstallationDoesNotExist):
    def __init__(
        self,
        *,
        for_equipment_lab: tuple[UUID, UUID] | None = None,
        for_id: UUID | None = None,
    ):
        super().__init__(for_installable_lab=for_equipment_lab, for_id=for_id)


class EquipmentInstallationAlreadyExists(ModelException):
    def __init__(self, equipment: Equipment | UUID, lab: Lab | UUID):
        super().__init__(
            f"An installation already exists for the equipment '{equipment}' in lab '{lab}'"
        )
