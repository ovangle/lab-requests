from uuid import UUID

from db import LocalSession
from db.models.equipment import Equipment, EquipmentInstallation
from db.models.lab import Lab
from ..base import (
    ModelIndex,
    ModelView,
    ModelCreateRequest,
)
from .equipment import EquipmentView, EquipmentCreateRequest


class EquipmentInstallationView(ModelView[EquipmentInstallation]):
    equipment: UUID
    equipment_name: str
    lab: UUID
    num_installed: int

    @classmethod
    async def from_model(
        cls,
        model: EquipmentInstallation,
        *,
        equipment: Equipment | None = None,
    ):
        if equipment is not None:
            equipment_ = equipment
        else:
            equipment_ = await model.awaitable_attrs.equipment

        return cls(
            id=model.id,
            equipment=equipment_.id,
            equipment_name=equipment_.name,
            lab=model.lab_id,
            num_installed=model.num_installed,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )


class EquipmentInstallationIndex(ModelIndex[EquipmentInstallationView]):
    __item_view__ = EquipmentInstallationView


# FIXME: mypy does not support PEP 695
type EquipmentInstallationPage = ModelIndexPage[EquipmentInstallationView]  # type: ignore


class EquipmentInstallRequest(ModelCreateRequest[Equipment]):
    """
    Represents a request to install an equipment into a specific
    lab.
    """

    equipment: Equipment | UUID | EquipmentCreateRequest
    lab: Lab | UUID

    async def do_create(self, db: LocalSession, **kwargs):
        raise NotImplementedError
