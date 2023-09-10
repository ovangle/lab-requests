from __future__ import annotations

from dataclasses import field
import dataclasses
from typing import TYPE_CHECKING, Dict, Optional, Type, TypeVar, Any, Union, cast

from humps import decamelize
from pydantic import BaseModel

from api.base.models import Base
from api.base.schemas import ApiModel, ModelPatch

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

    @classmethod
    def _init_from_model(cls: Type[T], instance: T, model: models.ResourceContainer) -> T:
        instance.equipments.extend(EquipmentLease(**equipment_json) for equipment_json in model.equipments)
        instance.input_materials.extend(InputMaterial(**input_material_json) for input_material_json in model.input_materials)
        instance.output_materials.extend(OutputMaterial(**output_material_json) for output_material_json in model.output_materials)
        instance.services.extend(Service(**service_json) for service_json in model.services)
        instance.softwares.extend(Software(**software_json) for software_json in model.softwares) 

        return instance


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
        return [
            resource_type(**json) for json in jsonb_resources
        ]

    def _replace_all(self, resource_type: Type[TResource], model: models.ResourceContainer, new_resources: list[TResource]):
        jsonb_resources = [dict(r) for r in new_resources] #type: ignore
        setattr(model, resource_name(resource_type), jsonb_resources)

    def _add_resources(self, resource_type, model, to_add: list[TResource]):
        current_resources = getattr(model, resource_name(resource_type))
        current_resources.extend([dataclasses.asdict(item) for item in to_add ])


    def _replace_resource(self, resource_type: Type[TResource], model: models.ResourceContainer, to_replace: dict[int, TResource]):
        jsonb_resources = list(self._get_resources(resource_type, model))
        for index in to_replace:
            jsonb_resources[index] = to_replace[index]
        self._replace_all(resource_type, model, jsonb_resources)

    def update_resource(self, resource_type: Type[TResource], model: models.ResourceContainer):
        all_items: list[Any]     = getattr(self, resource_name(resource_type))

        items_to_add: list[Any] | None = getattr(self, f'add_{resource_type}')
        items_to_replace: dict[int, TResource] | None = getattr(self, f'replace_{resource_type}')

        if all_items:
            if items_to_add or items_to_replace:
                raise ValueError(f'Cannot supply add_{resource_type} if {resource_type} is provided')
            self._replace_all(resource_type, model, all_items)
        else:
            if items_to_replace:
                self._replace_resource(resource_type, model, items_to_replace)
            if items_to_add:
                self._add_resources(resource_type, model, items_to_add)

    def apply(self, container: models.ResourceContainer):
        for resource_type in RESOURCE_TYPES:
            self.update_resource(resource_type, container)

