from dataclasses import field
from pydantic.dataclasses import dataclass

from .equipment.models import Equipment
from .software.models import Software
from .service.models import Service
from .input_material.models import InputMaterial
from .output_material.models import OutputMaterial

@dataclass(kw_only=True)
class ResourceContainer:
    equipments: list[Equipment]
    input_materials: list[InputMaterial]
    output_materials: list[OutputMaterial]
    services: list[Service]
    softwares: list[Software]