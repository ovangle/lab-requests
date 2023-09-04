from dataclasses import field
from typing import TYPE_CHECKING, Type, TypeVar, Any, cast
from pydantic.dataclasses import dataclass

from .equipment.schemas import Equipment
from .software.schemas import Software
from .service.schemas import Service
from .input_material.schemas import InputMaterial
from .output_material.schemas import OutputMaterial

if TYPE_CHECKING:
    from . import models

T = TypeVar('T', bound='ResourceContainer')

@dataclass(kw_only=True)
class ResourceContainer:
    equipments: list[Equipment] = field(default_factory=list)
    input_materials: list[InputMaterial] = field(default_factory=list)
    output_materials: list[OutputMaterial] = field(default_factory=list)
    services: list[Service] = field(default_factory=list)
    softwares: list[Software] = field(default_factory=list)


    @classmethod
    def _init_from_model(cls: Type[T], instance: T, model: models.ResourceContainer) -> T:
        instance.equipments.extend(
            [Equipment(**(cast(equipment_json, Any)) for equipment_json in instance.equipments]
        )
        instance.input_materials.extend(
            InputMaterial(**input_material_json) for input_material_json in instance.input_materials
        )
        instance.output_materials.extend(
            OutputMaterial(**output_material_json) for output_material_json in instance.output_materials
        )
        instance.services.extend(
            Service(**service_json) for service_json in instance.services
        )
        instance.softwares.extend(
            Software(**software_json) for software_json in instance.softwares
        )
        return instance

