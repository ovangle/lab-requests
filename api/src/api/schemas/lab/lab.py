from __future__ import annotations
import asyncio
from uuid import UUID

from pydantic import Field

from db import LocalSession
from db.models.lab.lab import query_labs
from db.models.uni import Discipline
from db.models.lab import Lab
from db.models.uni.campus import Campus

from ..base import ModelLookup, ModelIndexPage, ModelDetail, ModelIndex

from ..user.user import UserDetail
from ..uni.campus import CampusDetail


class LabDetail(ModelDetail[Lab]):
    id: UUID
    discipline: Discipline
    campus: CampusDetail

    supervisors: list[UserDetail]

    @classmethod
    async def from_model(cls, lab: Lab) -> LabDetail:
        campus = await CampusDetail.from_model(await lab.awaitable_attrs.campus)

        supervisor_models = await lab.awaitable_attrs.supervisors

        supervisors = await asyncio.gather(
            *(UserDetail.from_model(s) for s in supervisor_models)
        )

        return cls(
            id=lab.id,
            discipline=lab.discipline,
            campus=campus,
            supervisors=supervisors,
            created_at=lab.created_at,
            updated_at=lab.updated_at,
        )


class LabLookup(ModelLookup[Lab]):
    id: UUID | None = None

    async def get(self, db: LocalSession):
        if self.id:
            return await Lab.get_by_id(db, self.id)
        raise ValueError("Expected an id")


async def lookup_lab(db: LocalSession, ref: LabLookup | UUID):
    if isinstance(ref, UUID):
        return await Lab.get_by_id(db, ref)
    return await ref.get(db)


class LabIndex(ModelIndex[Lab]):
    __item_detail_type__ = LabDetail

    campus: Campus | None = None
    discipline: Discipline | None = None
    search: str | None = None
    id_in: list[UUID] | None = None

    def get_selection(self):
        return query_labs(
            campus=self.campus,
            discipline=self.discipline,
            search=self.search,
            id_in=self.id_in,
        )


# TODO: PEP 695 type
LabIndexPage = ModelIndexPage[Lab]


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
