from __future__ import annotations
import asyncio

from typing import Generic, Self, TypeVar

from sqlalchemy import select
from api.lab.lab_resources.schemas.equipment_lease import LabEquipmentLeaseIndex
from api.lab.lab_resources.schemas.input_material import InputMaterialIndex
from api.lab.lab_resources.schemas.output_material import OutputMaterialIndex
from api.lab.lab_resources.schemas.software_lease import LabSoftwareLeaseIndex
from db import local_object_session

from db.models.lab import LabResourceContainer, LabResource
from db.models.lab.lab_resource import LabResourceType
from db.models.lab.lab_resource_container import LabResourceConsumer
from db.models.lab.resources.equipment_lease import EquipmentLease
from db.models.lab.resources.input_material import InputMaterial
from db.models.lab.resources.output_material import OutputMaterial
from db.models.lab.resources.software_lease import SoftwareLease

from ..base import BaseModel, ModelIndexPage, ModelUpdateRequest, ModelView

from .lab_resources.schemas import (
    LabEquipmentLeaseView,
    LabEquipmentLeasePatch,
    LabSoftwareLeaseView,
    LabSoftwareLeasePatch,
    InputMaterialView,
    InputMaterialPatch,
    OutputMaterialView,
    OutputMaterialPatch,
    LabResourcePatch,
)

# TODO: PEP 695
TResource = TypeVar("TResource", bound=LabResource, contravariant=True)
TResourcePatch = TypeVar("TResourcePatch", bound=LabResourcePatch)
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


class ResourceContainerSlice(BaseModel, Generic[TResource, TResourcePatch]):
    type: LabResourceType
    start_index: int
    end_index: int | None = None

    items: list[TResourcePatch]

    async def do_update(self, model: LabResourceContainer):
        item_attrs = [item.as_attrs() for item in self.items]
        await model.splice_resources(
            self.type, self.start_index, self.end_index, item_attrs
        )


class UpdateLabResourceConsumer(ModelUpdateRequest[TResourceConsumer]):
    equipment_leases: list[
        ResourceContainerSlice[EquipmentLease, LabEquipmentLeasePatch]
    ] | None = None
    software_leases: list[
        ResourceContainerSlice[SoftwareLease, LabSoftwareLeasePatch]
    ] | None = None

    input_materials: list[
        ResourceContainerSlice[InputMaterial, InputMaterialPatch]
    ] | None = None
    output_materials: list[
        ResourceContainerSlice[OutputMaterial, OutputMaterialPatch]
    ] | None = None

    async def _do_update_resource(
        self, model: TResourceConsumer, slices: list[ResourceContainerSlice]
    ):
        container = await model.awaitable_attrs.container
        for slice in slices:
            await slice.do_update(container)

    async def do_update(self, model: TResourceConsumer, **kwargs):
        if self.equipment_leases is not None:
            await self._do_update_resource(model, self.equipment_leases)

        if self.software_leases is not None:
            await self._do_update_resource(model, self.software_leases)

        if self.input_materials is not None:
            await self._do_update_resource(model, self.input_materials)

        if self.output_materials is not None:
            await self._do_update_resource(model, self.output_materials)
