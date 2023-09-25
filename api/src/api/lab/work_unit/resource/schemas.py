from __future__ import annotations
from abc import abstractmethod

from dataclasses import field
import dataclasses
from typing import TYPE_CHECKING, Dict, Optional, Type, TypeVar, Any, Union, cast

from humps import decamelize
from pydantic import BaseModel, ValidationError

from api.base.models import Base
from api.base.schemas import ApiModel, ModelPatch
from db import LocalSession

from .equipment_lease.schemas import EquipmentLease
from .software.schemas import Software
from .service.schemas import Service
from .input_material.schemas import InputMaterial
from .output_material.schemas import OutputMaterial

if TYPE_CHECKING:
    from . import models

T = TypeVar('T', bound='ResourceContainer')

RESOURCE_TYPES = [EquipmentLease, Software, Service, InputMaterial, OutputMaterial]
Resource = Union[EquipmentLease, Software, Service, InputMaterial, OutputMaterial]

def is_resource(obj):
    return any(isinstance(obj, t) for t in RESOURCE_TYPES)

TResource = TypeVar('TResource', bound=Resource)

def resource_name(resource: TResource | Type[TResource]) -> str:
    if isinstance(resource, type):
        return decamelize(resource.__name__.lower())
    return resource_name(type(resource))


class ResourceContainer(BaseModel):
    equipments: list[EquipmentLease] = field(default_factory=list)
    input_materials: list[InputMaterial] = field(default_factory=list)
    output_materials: list[OutputMaterial] = field(default_factory=list)
    services: list[Service] = field(default_factory=list)
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
        self.services = [
            Service(**resource_json(item)) for item in model.services
        ]

class ResourceContainerPatch(BaseModel):
    equipments: list[EquipmentLease] | None = None
    add_equipments: list[EquipmentLease] | None = None
    replace_equipments: dict[int, EquipmentLease] | None = None

    input_materials: list[InputMaterial] | None = None
    add_input_materials: list[InputMaterial] | None = None
    replace_input_material: dict[int, InputMaterial] | None = None

    output_materials: list[OutputMaterial] | None = None
    add_output_materials: list[OutputMaterial] | None = None
    replace_output_material: dict[int, OutputMaterial] | None = None

    services: list[Service] | None = None
    add_services: list[Service] | None = None
    replace_service: dict[int, Service] | None = None

    softwares: list[Software] | None = None
    add_softwares: list[Software] | None = None
    replace_softwares: dict[int, Service] | None = None

    def _get_resources(self, resource_type: Type[TResource], model: models.ResourceContainer) -> list[TResource]:
        jsonb_resources: list[dict] = getattr(model, resource_name(resource_type))
        return cast(list[TResource], [
            resource_type(**json) for json in jsonb_resources
        ])

    def _replace_all(self, resource_type: Type[TResource], model: models.ResourceContainer, new_resources: list[TResource]):
        jsonb_resources = [dict(r) for r in new_resources] #type: ignore
        setattr(model, resource_name(resource_type), jsonb_resources)

    def _add_resources(self, resource_type, model: models.ResourceContainer, to_add: list[TResource]):
        current_resources = getattr(model, resource_name(resource_type))

        model_plan_id = model.get_plan_id()
        model_work_unit_id = model.get_work_unit_id()
        model_index = len(model.get_resources(resource_type))

        # Ensure that all added resources have the correct plan_id, work_unit_id and index.
        for item in to_add:
            if item.plan_id and item.plan_id != model_plan_id:
                raise ValidationError('Resource belongs to a different plan')
            item.plan_id = model_plan_id
            if item.work_unit_id and item.work_unit_id !=  model_work_unit_id:
                raise ValidationError('Resource belongs to a differet work unit')
            item.work_unit_id = model_work_unit_id

            item.index = model_index
            model_index += 1

        current_resources.extend([item.model_dump_json() for item in to_add])

    def _replace_resource(self, resource_type: Type[TResource], model: models.ResourceContainer, to_replace: dict[int, TResource]):
        jsonb_resources = list(self._get_resources(resource_type, model))

        model_plan_id = model.get_plan_id()
        model_work_unit_id = model.get_work_unit_id()

        for index in to_replace:
            item = to_replace[index]
            if item.plan_id != model_plan_id:
                raise ValidationError(f'Cannot update plan_id of {resource_type}')
            if item.work_unit_id != model_work_unit_id:
                raise ValidationError(f'Cannot update work_unit_id of {resource_type}')
            if item.index != index:
                raise NotImplementedError(f'Should splice all these lists')
            jsonb_resources[index] = item

        self._replace_all(resource_type, model, jsonb_resources)

    def _remove_resource(self, resource_type: Type[TResource], model: models.ResourceContainer, to_remove: list[int]):
        raise NotImplementedError

    def _update_fields_for_type(self, resource_type: Type[TResource]) -> tuple[list[TResource], dict[int, TResource], list[int]]:
        r_name = resource_name(resource_type)
        to_add: list[TResource] = getattr(self, f'add_{r_name}s', [])

        replace_items = getattr(self, f'replace_{r_name}', None)
        to_replace: dict[int, TResource] = {
            int(k): v for k, v in (replace_items or {}).items()
        }
        to_remove: list[int] = getattr(self, f'del_{r_name}s', [])
        return (to_add, to_replace, to_remove)

    def _update_resources_of_type(self, resource_type: Type[TResource], model: models.ResourceContainer):
        (items_to_add, items_to_replace, items_to_remove) = self._update_fields_for_type(resource_type)
        if items_to_add:
            if items_to_replace or items_to_remove:
                raise ValidationError(f'Cannot replace or remove {resource_name(resource_type)} in same request as add')
            self._add_resources(resource_type, model, items_to_add)
                
        if items_to_replace:
            if items_to_remove:
                raise ValidationError('Cannot replace and remove {resource_type} in same request as replace')
            self._replace_resource(resource_type, model, items_to_replace)
        
        if items_to_remove:
            self._remove_resource(resource_type, model, items_to_remove)

    def _is_update_to_resources_of_type(self, resource_type: Type[TResource]):
        (to_add, to_replace, to_remove) = self._update_fields_for_type(resource_type)
        return to_add or to_replace or to_remove

    async def update_model_resources(self, db: LocalSession, model: models.ResourceContainer):
        for resource_type in RESOURCE_TYPES:
            resource_type_ = cast(Type, resource_type)
            if self._is_update_to_resources_of_type(resource_type_):
                self._update_resources_of_type(resource_type_, model)
                db.add(model)