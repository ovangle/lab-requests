from __future__ import annotations
import asyncio

from typing import Self, TypeVar

from sqlalchemy.ext.asyncio import async_object_session
from db import LocalSession

from db.models.lab import LabResourceContainer, LabResource
from db.models.lab.lab_resource import LabResourceType

from ..base.schemas import ModelView

from .lab_resources.schemas import (
    LabEquipmentLeaseView,
    LabSoftwareLeaseView,
    InputMaterialView,
    OutputMaterialView,
)

# TODO: PEP 695
TResource = TypeVar("TResource", bound=LabResource, contravariant=True)
TResourceConsumer = TypeVar("TResourceConsumer", bound=LabResourceContainer)


class LabResourceConsumerView(ModelView[TResourceConsumer]):
    equipments: list[LabEquipmentLeaseView]
    softwares: list[LabSoftwareLeaseView]
    input_materials: list[InputMaterialView]
    output_materials: list[OutputMaterialView]

    @classmethod
    async def from_model(cls: type[Self], model: TResourceConsumer, **kwargs) -> Self:
        equipment_models = await model.equipment_leases
        equipments = await asyncio.gather(
            *(LabEquipmentLeaseView.from_model(m) for m in equipment_models)
        )

        software_models = await model.software_leases
        softwares = await asyncio.gather(
            *(LabSoftwareLeaseView.from_model(m) for m in software_models)
        )

        input_material_models = await model.input_materials
        input_materials = await asyncio.gather(
            *(InputMaterialView.from_model(m) for m in input_material_models)
        )

        output_material_models = await model.output_materials
        output_materials = await asyncio.gather(
            *(OutputMaterialView.from_model(m) for m in output_material_models)
        )

        return cls(
            equipments=equipments,
            softwares=softwares,
            input_materials=input_materials,
            output_materials=output_materials,
            **kwargs,
        )
