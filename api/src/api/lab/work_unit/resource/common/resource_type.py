from __future__ import annotations

from enum import Enum
from typing import Type, TYPE_CHECKING, TypeVar

if TYPE_CHECKING:
    from .schemas import ResourceBase

TResource = TypeVar('TResource', bound='ResourceBase')


class ResourceType(Enum):
    EQUIPMENT = 'equipment'
    SOFTWARE = 'software'
    TASK = 'task'
    INPUT_MATERIAL = 'input-material'
    OUTPUT_MATERIAL = 'output-material'

    @classmethod
    def for_resource(cls, value: Type[TResource] | TResource | ResourceType | str) -> ResourceType:
        if hasattr(value, '__resource_type__'):
            return cls(getattr(value, '__resource_type__'))
        else:
            return cls(value)

    @property
    def container_attr_name(self):
        match self.value:
            case 'equipment':
                return 'equipments'
            case 'software':
                return 'softwares'
            case 'task':
                return 'tasks'
            case 'input-material':
                return 'input_materials'
            case 'output-material':
                return 'output_materials'
            case _:
                raise ValueError('Unexpected attribute')

