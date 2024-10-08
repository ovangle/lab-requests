from __future__ import annotations
import asyncio
from typing import override
from uuid import UUID

from pydantic import Field
from sqlalchemy import select

from db import LocalSession, local_object_session
from db.models.lab.disposable.lab_disposal import query_lab_disposals
from db.models.lab.lab import query_labs
from db.models.lab.storable.lab_storage import query_lab_storages
from db.models.uni import Discipline
from db.models.lab import Lab
from db.models.uni.campus import Campus
from db.models.user import User, query_users


from api.schemas.user import UserDetail, UserIndexPage
from api.schemas.uni import CampusDetail

from ..base_schemas import ModelLookup, ModelIndexPage, ModelDetail
from .lab_storage_schemas import LabStorageIndexPage
from .lab_disposal_schemas import LabDisposalIndexPage


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

        supervisors = await UserIndexPage.from_selection(
            db,
            query_users(supervises_lab=model),
        )

        lab_storages = await LabStorageIndexPage.from_selection(
            db,
            query_lab_storages(lab=model),
        )
        lab_disposals = await LabDisposalIndexPage.from_selection(
            db,
            query_lab_disposals(lab=model),
        )


        return await cls._from_base(
            model,
            discipline=model.discipline,
            campus=campus,
            supervisors=supervisors,
            storages=lab_storages,
            disposals=lab_disposals
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


class LabIndexPage(ModelIndexPage[Lab, LabDetail]):
    @classmethod
    @override
    async def item_from_model(cls, item: Lab):
        return await LabDetail.from_model(item)


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
