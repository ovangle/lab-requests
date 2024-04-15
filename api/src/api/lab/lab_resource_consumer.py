from __future__ import annotations
import asyncio

from typing import Self, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_object_session
from api.lab.lab_resources.schemas.equipment_lease import LabEquipmentLeaseIndex
from api.lab.lab_resources.schemas.input_material import InputMaterialIndex
from api.lab.lab_resources.schemas.output_material import OutputMaterialIndex
from api.lab.lab_resources.schemas.software_lease import LabSoftwareLeaseIndex
from db import LocalSession, local_object_session

from db.models.lab import LabResourceContainer, LabResource
from db.models.lab.lab_resource import LabResourceType
from db.models.lab.lab_resource_container import LabResourceConsumer
from db.models.lab.resources.equipment_lease import EquipmentLease
from db.models.lab.resources.input_material import InputMaterial
from db.models.lab.resources.output_material import OutputMaterial
from db.models.lab.resources.software_lease import SoftwareLease

from ..base.schemas import ModelIndexPage, ModelView

from .lab_resources.schemas import (
    LabEquipmentLeaseView,
    LabSoftwareLeaseView,
    InputMaterialView,
    OutputMaterialView,
)

# TODO: PEP 695
TResource = TypeVar("TResource", bound=LabResource, contravariant=True)
TResourceConsumer = TypeVar("TResourceConsumer", bound=LabResourceConsumer)


class LabResourceConsumerView(ModelView[TResourceConsumer]):
    equipment_leases: ModelIndexPage[LabEquipmentLeaseView]
    software_leases: ModelIndexPage[LabSoftwareLeaseView]
    input_materials: ModelIndexPage[InputMaterialView]
    output_materials: ModelIndexPage[OutputMaterialView]

    @classmethod
    async def from_model(cls: type[Self], model: TResourceConsumer, **kwargs) -> Self:
        session = local_object_session(model)

        select_equipment_leases = select(EquipmentLease).where(
            EquipmentLease.container_id == model.container_id
        )
        equipment_lease_index = LabEquipmentLeaseIndex(
            select_equipment_leases, consumer_id=model.id
        )
        equipment_lease_page = await equipment_lease_index.load_page(session, 1)

        select_software_leases = select(SoftwareLease).where(
            SoftwareLease.container_id == model.container_id
        )
        software_lease_index = LabSoftwareLeaseIndex(
            select_software_leases, consumer_id=model.id
        )
        software_lease_page = await software_lease_index.load_page(session, 1)

        select_input_materials = select(InputMaterial).where(
            InputMaterial.container_id == model.container_id
        )
        input_material_index = InputMaterialIndex(
            select_input_materials, consumer_id=model.id
        )
        input_material_page = await input_material_index.load_page(session, 1)

        select_output_materials = select(OutputMaterial).where(
            OutputMaterial.container_id == model.container_id
        )
        output_material_index = OutputMaterialIndex(
            select_output_materials, consumer_id=model.id
        )
        output_material_page = await output_material_index.load_page(session, 1)

        return cls(
            equipment_leases=equipment_lease_page,
            software_leases=software_lease_page,
            input_materials=input_material_page,
            output_materials=output_material_page,
            **kwargs,
        )
