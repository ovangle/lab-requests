from __future__ import annotations
from abc import abstractmethod

from dataclasses import field
import dataclasses
from typing import TYPE_CHECKING, Dict, Generic, Literal, Optional, Type, TypeVar, Any, Union, cast
from uuid import UUID

from humps import decamelize
from pydantic import BaseModel, Field, ValidationError

from api.base.models import Base
from api.base.schemas import ApiModel, ModelPatch
from db import LocalSession

from .equipment_lease.schemas import EquipmentLease
from .software.schemas import Software
from .task.schemas import Task
from .input_material.schemas import InputMaterial
from .output_material.schemas import OutputMaterial

if TYPE_CHECKING:
    from . import models

Resource = Union[EquipmentLease, Software, Task, InputMaterial, OutputMaterial]
RESOURCE_TYPES: list[type] = [EquipmentLease, Software, Task, InputMaterial, OutputMaterial]

def is_resource(obj):
    return any(isinstance(obj, t) for t in RESOURCE_TYPES)

TResource = TypeVar('TResource', bound=Resource)

def resource_name(resource: TResource | Type[TResource]) -> str:
    if isinstance(resource, type):
        if issubclass(resource, EquipmentLease):
            return 'equipments'
        if issubclass(resource, Software):
            return 'softwares'
        if issubclass(resource, Task):
            return 'tasks'
        if issubclass(resource, InputMaterial):
            return 'input_materials'
        if issubclass(resource, OutputMaterial):
            return 'output_materials'
        raise ValidationError('Unrecognised resource type')
    return resource_name(type(resource))


class ResourceContainer(BaseModel):
    id: UUID

    equipments: list[EquipmentLease] = field(default_factory=list)
    input_materials: list[InputMaterial] = field(default_factory=list)
    output_materials: list[OutputMaterial] = field(default_factory=list)
    tasks: list[Task] = field(default_factory=list)
    softwares: list[Software] = field(default_factory=list)

    def get_resources(self, resource_type: Type[TResource]) -> list[TResource]:
        return getattr(self, resource_name(resource_type))

    def _set_resource_container_fields_from_model(self, model: ResourceContainer | models.ResourceContainer):
        def resource_json(resource: Resource | dict[str, Any]) -> dict[str, Any]: 
            if isinstance(resource, dict):
                return resource
            return resource.model_dump()

        self.equipments = [
            EquipmentLease(**resource_json(item)) for item in model.equipments
        ]
        self.input_materials = [
            InputMaterial(**resource_json(item)) for item in model.input_materials
        ]
        self.output_materials = [
            OutputMaterial(**resource_json(item)) for item in model.output_materials
        ]
        self.tasks = [
            Task(**resource_json(item)) for item in model.tasks
        ]

class Slice(BaseModel, Generic[TResource]):
    start: int
    end: int | None = None
    items: list[TResource]

    def update_items(self, container_id: UUID):
        for i, item in enumerate(self.items):
            if item.container_id and item.container_id != container_id:
                raise ValidationError('Resource belongs to a different plan')
            item.container_id = container_id
            item.index = self.start + i

    def update_model_resources(self, model_resources: list[TResource]):
        model_resources[self.start:self.end] = self.items

        if self.end is not None and self.start - self.end != len(self.items):
            for i, item in enumerate(model_resources[self.end:]):
                item.index = self.end + i

class ResourceContainerPatch(BaseModel):
    equipments: list[Slice[EquipmentLease]] = Field(default_factory=list)
    input_materials: list[Slice[InputMaterial]] = Field(default_factory=list)
    output_materials: list[Slice[OutputMaterial]] = Field(default_factory=list)
    tasks: list[Slice[Task]] = Field(default_factory=list)
    softwares: list[Slice[Software]] = Field(default_factory=list)

    def _get_resources(self, resource_type: Type[TResource], model: models.ResourceContainer) -> list[TResource]:
        jsonb_resources: list[dict] = getattr(model, resource_name(resource_type))
        return cast(list[TResource], [
            resource_type(**json) for json in jsonb_resources
        ])

    def _apply_slices(self, db: LocalSession, resource_type: Type[TResource], container: models.ResourceContainer):
        slices: list[Slice[TResource]] = getattr(self, resource_name(resource_type))
        container_resources = self._get_resources(resource_type, container)[:]

        for slice in slices:
            slice.update_items(container.id)
            slice.update_model_resources(container_resources)

        if slices:
            setattr(
                container, 
                resource_name(resource_type), 
                [r.model_dump() for r in container_resources]
            )
            db.add(container)

    async def update_model_resources(self, db: LocalSession, model: models.ResourceContainer):
        for resource_type in RESOURCE_TYPES:
            self._apply_slices(db, resource_type, model)