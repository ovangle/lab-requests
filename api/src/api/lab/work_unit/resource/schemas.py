from __future__ import annotations
from abc import abstractmethod

from dataclasses import field
import dataclasses
import functools
from typing import (
    TYPE_CHECKING,
    Dict,
    Generic,
    Literal,
    Optional,
    Type,
    TypeVar,
    Any,
    Union,
    cast,
)
from uuid import UUID

from humps import decamelize
from pydantic import BaseModel, Field, ValidationError

from api.base.models import Base
from api.base.schemas import ApiModel, ModelPatch
from api.lab.work_unit.resource.common.schemas import ResourceType
from api.lab.work_unit.resource.models import ResourceContainerFileAttachment_
from db import LocalSession

from .common.schemas import (
    ResourceParams,
    ResourceType,
    ResourceBase,
    ResourceStorage,
    ResourceDisposal,
    ResourceFileAttachment,
)

from .equipment_lease.schemas import EquipmentLease, EquipmentLeaseParams
from .software.schemas import Software, SoftwareParams
from .task.schemas import Task, TaskParams
from .input_material.schemas import InputMaterial, InputMaterialParams
from .output_material.schemas import OutputMaterial, OutputMaterialParams

if TYPE_CHECKING:
    from . import models

__all__ = (
    "Resource",
    "ResourceBase",
    "ResourceContainer",
    "ResourceContainerPatch",
    "ResourceType",
    "RESOURCE_TYPES",
    "ResourceDisposal",
    "ResourceFileAttachment",
    "ResourceStorage",
)

Resource = Union[EquipmentLease, Software, Task, InputMaterial, OutputMaterial]
RESOURCE_TYPES: list[type] = [
    EquipmentLease,
    Software,
    Task,
    InputMaterial,
    OutputMaterial,
]

TResource = TypeVar("TResource", bound=ResourceBase)


def resource_name(t: ResourceType | TResource | Type[TResource]):
    return ResourceType.for_resource(t).container_attr_name


class ResourceContainer(BaseModel):
    id: UUID

    equipments: list[EquipmentLease] = field(default_factory=list)
    input_materials: list[InputMaterial] = field(default_factory=list)
    output_materials: list[OutputMaterial] = field(default_factory=list)
    tasks: list[Task] = field(default_factory=list)
    softwares: list[Software] = field(default_factory=list)

    def get_resources(
        self, resource_type: Type[TResource] | ResourceType
    ) -> list[TResource]:
        return getattr(self, resource_name(resource_type))

    def get_resource(
        self, resource_type: Type[TResource] | ResourceType, index_or_id: UUID | int
    ) -> TResource:
        resources = self.get_resources(resource_type)
        match index_or_id:
            case UUID():
                index = [r.id for r in resources].index(index_or_id)
            case int():
                index = index_or_id
        return self.get_resources(resource_type)[index]

    def _set_resource_container_fields_from_model(
        self, model: ResourceContainer | models.ResourceContainer_
    ):
        def resource_json(resource: Resource | dict[str, Any]) -> dict[str, Any]:
            if isinstance(resource, dict):
                return resource
            return resource.model_dump()

        self.equipments = [EquipmentLease(**resource_json(item)) for item in model.equipments]
        self.input_materials = [InputMaterial(**resource_json(item)) for item in model.input_materials]
        self.output_materials = [OutputMaterial(**resource_json(item)) for item in model.output_materials]
        self.softwares = [Software(**resource_json(item)) for item in model.softwares]
        self.tasks = [Task(**resource_json(item)) for item in model.tasks]

TResourceParams = TypeVar('TResourceParams', bound=ResourceParams)

class Slice(BaseModel, Generic[TResource, TResourceParams]):
    start: int | Literal['append']
    end: int | None = None
    items: list[TResourceParams]

    def _create_or_update_resource(
        self, 
        container_id: UUID,
        resource_type: type[TResource],
        model_resources: list[TResource],
        offset: int,
        params: TResourceParams,
    ):
        if self.start == 'append':
            if self.end is not None:
                raise IndexError('Invalid index. An append slice cannot have a terminal index')
            at_index = len(model_resources)
        elif self.start < 0:
            raise IndexError('Invalid slice. Negative indices not supported')
        else:
            at_index = self.start + offset
        
        if at_index >= len(model_resources):
            return resource_type.create(container_id, at_index, params)
        else:
            resource = model_resources[at_index]
            return resource.apply(params)


    def update_model_resources(self, container_id: UUID, resource_type: type[TResource], model_resources: list[TResource]):
        create_or_update_resource = functools.partial(
            self._create_or_update_resource,
            container_id,
            resource_type,
            model_resources
        )
        if self.start == 'append':
            model_resources += [
                create_or_update_resource(i, params)
                for (i, params) in enumerate(self.items)
            ]
        else:
            model_resources[self.start : self.end] = [
                create_or_update_resource(i, params)
                for (i, params) in enumerate(self.items)
            ]

            if self.end is not None and self.start - self.end != len(self.items):
                for i, item in enumerate(model_resources[self.end :]):
                    item.index = self.end + i

EquipmentLeaseSlice = Slice[EquipmentLease, EquipmentLeaseParams]
InputMaterialSlice = Slice[InputMaterial, InputMaterialParams]
OutputMaterialSlice = Slice[OutputMaterial, OutputMaterialParams]
TaskSlice = Slice[Task, TaskParams]
SoftwareSlice = Slice[Software, SoftwareParams]

class ResourceContainerPatch(BaseModel):
    equipments: list[EquipmentLeaseSlice] = Field(default_factory=list)
    input_materials: list[InputMaterialSlice] = Field(default_factory=list)
    output_materials: list[OutputMaterialSlice] = Field(default_factory=list)
    tasks: list[TaskSlice] = Field(default_factory=list)
    softwares: list[SoftwareSlice] = Field(default_factory=list)

    def _get_resources(
        self, resource_type: Type[TResource], model: models.ResourceContainer_
    ) -> list[TResource]:
        jsonb_resources: list[dict] = getattr(model, resource_name(resource_type))
        return cast(
            list[TResource], [resource_type(**json) for json in jsonb_resources]
        )

    def _apply_slices(
        self,
        db: LocalSession,
        resource_type: Type[TResource],
        container: models.ResourceContainer_,
    ):
        slices: list[Slice[TResource, Any]] = getattr(self, resource_name(resource_type))
        container_resources = self._get_resources(resource_type, container)[:]

        for slice in slices:
            slice.update_model_resources(container.id, resource_type, container_resources)

        if slices:
            setattr(
                container,
                resource_name(resource_type),
                [r.model_dump() for r in container_resources],
            )
            db.add(container)

    async def update_model_resources(
        self, db: LocalSession, model: models.ResourceContainer_
    ):
        for resource_type in RESOURCE_TYPES:
            self._apply_slices(db, resource_type, model)