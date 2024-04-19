from __future__ import annotations
import asyncio
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import not_, select


from db import LocalSession, local_object_session
from db.models.lab.lab_equipment import LabEquipmentInstallation, LabEquipmentProvision
from db.models.user import User
from db.models.uni import Discipline
from db.models.lab import Lab

from ..base.schemas import ModelLookup, ModelIndexPage, ModelView, ModelIndex

from ..user.schemas.user import UserView
from ..uni.schemas import CampusView

if TYPE_CHECKING:
    from .lab_equipment.schemas import (
        LabEquipmentInstallationView,
        LabEquipmentProvisionView,
    )


class LabView(ModelView[Lab]):
    id: UUID
    discipline: Discipline
    campus: CampusView

    supervisors: list[UserView]

    @classmethod
    async def _from_model(cls, lab: Lab, **kwargs) -> LabView:
        campus = await CampusView.from_model(await lab.awaitable_attrs.campus)

        supervisor_models = await lab.awaitable_attrs.supervisors

        supervisors = await asyncio.gather(
            *(UserView.from_model(s) for s in supervisor_models)
        )

        return cls(
            id=lab.id,
            discipline=lab.discipline,
            campus=campus,
            supervisors=supervisors,
            created_at=lab.created_at,
            updated_at=lab.updated_at,
            **kwargs,
        )

    @classmethod
    def from_model(cls, lab: Lab):
        return cls._from_model(lab)


class LabLookup(ModelLookup[Lab]):
    id: UUID | None = None

    async def get(self, db: LocalSession):
        if self.id:
            return await Lab.get_for_id(db, self.id)
        raise ValueError("Expected an id")


async def lookup_lab(db: LocalSession, ref: LabLookup | UUID):
    if isinstance(ref, UUID):
        return await Lab.get_for_id(db, ref)
    return await ref.get(db)


class LabIndex(ModelIndex[LabView]):
    __item_view__ = LabView


# TODO: PEP 695 type
LabIndexPage = ModelIndexPage[LabView]


# class LabProfileView(LabView):
#     equipment_installations: ModelIndexPage[LabEquipmentInstallationView]
#     equipment_provisions: ModelIndexPage[LabEquipmentProvisionView]

#     @classmethod
#     async def from_model(cls, model: Lab):
#         from .lab_equipment.schemas import (
#             LabEquipmentInstallationIndex,
#             LabEquipmentProvisionIndex,
#         )

#         db = local_object_session(model)
#         equipment_installation_index = LabEquipmentInstallationIndex(
#             select(LabEquipmentInstallation).where(
#                 LabEquipmentInstallation.lab_id == model.id,
#                 LabEquipmentInstallation.provision_status == "installed",
#             )
#         )
#         equipment_installations = await equipment_installation_index.load_page(db, 1)
#         equipment_provision_index = LabEquipmentProvisionIndex(
#             select(LabEquipmentProvision).where(
#                 LabEquipmentProvision.lab_id == model.id,
#                 not_(LabEquipmentProvision.status.in_(["installed", "cancelled"])),
#             )
#         )
#         equipment_provisions = await equipment_provision_index.load_page(db, 1)

#         return await super()._from_model(
#             model,
#             equipment_installations=equipment_installations,
#             equipment_provisions=equipment_provisions,
#         )
