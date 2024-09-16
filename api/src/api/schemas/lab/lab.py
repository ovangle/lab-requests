from __future__ import annotations
import asyncio
from uuid import UUID

from pydantic import Field
from sqlalchemy import select

from db import LocalSession, local_object_session
from db.models.lab.lab import query_labs
from db.models.uni import Discipline
from db.models.lab import Lab
from db.models.uni.campus import Campus
from db.models.user import User

from ..base import ModelLookup, ModelIndexPage, ModelDetail, ModelIndex

from ..user.user import UserIndex, UserIndexPage
from ..uni.campus import CampusDetail

from .lab_storage import LabStorageIndex, LabStorageIndexPage
from .lab_disposal import LabDisposalIndex, LabDisposalIndexPage


class LabDetail(ModelDetail[Lab]):
    id: UUID
    discipline: Discipline
    campus: CampusDetail

    supervisors: UserIndexPage

    storages: LabStorageIndexPage
    disposals: LabDisposalIndexPage

    @classmethod
    async def from_model(cls, model: Lab) -> LabDetail:
        db = local_object_session(model)

        campus = await CampusDetail.from_model(await model.awaitable_attrs.campus)

        supervisor_index = UserIndex(supervises_lab=model.id)

        lab_storage_index = LabStorageIndex(lab=model.id)
        lab_disposal_index = LabDisposalIndex(lab=model.id)

        return await cls._from_base(
            model,
            discipline=model.discipline,
            campus=campus,
            supervisors=await supervisor_index.load_page(db),
            storages=await lab_storage_index.load_page(db),
            disposals=await lab_disposal_index.load_page(db),
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
    supervised_by: UUID | None = None

    async def item_from_model(self, model: Lab):
        return await LabDetail.from_model(model)

    def get_selection(self):
        return query_labs(
            campus=self.campus,
            discipline=self.discipline,
            search=self.search,
            id_in=self.id_in,
            supervised_by=self.supervised_by
        )


# TODO: PEP 695 type
LabIndexPage = ModelIndexPage[Lab, LabDetail]


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
