from dataclasses import field
from pydantic.dataclasses import dataclass

from .equipment.schemas import Equipment
from .software.schemas import Software
from .service.schemas import Service
from .input_material.schemas import InputMaterial
from .output_material.schemas import OutputMaterial

@dataclass(kw_only=True)
class ResourceContainer:
    equipments: list[Equipment] = field(default_factory=list)
    input_materials: list[InputMaterial] = field(default_factory=list)
    output_materials: list[OutputMaterial] = field(default_factory=list)
    services: list[Service] = field(default_factory=list)
    softwares: list[Software] = field(default_factory=list)
