from __future__ import annotations
from datetime import datetime
from enum import Enum
import re
from typing import TYPE_CHECKING, Any, ClassVar, Literal, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel, GetCoreSchemaHandler
from pydantic_core import core_schema

from api.base.schemas import SCHEMA_CONFIG

if TYPE_CHECKING:
    from api.lab.plan.schemas import ExperimentalPlan
    from api.lab.work_unit.schemas import WorkUnit

TResource = TypeVar('TResource', bound='ResourceBase')

class ResourceType(Enum):
    EQUIPMENT = 'equipment'
    SOFTWARE = 'software'
    TASK = 'task'
    INPUT_MATERIAL = 'input-material'
    OUTPUT_MATERIAL = 'output-material'

    @classmethod
    def for_resource(cls, resource: TResource | Type[TResource]) -> ResourceType:
        if isinstance(resource, type):
            return getattr(resource, '__resource_type__')
        return cls.for_resource(type(resource))

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


class HazardClass(str):
    RE = re.compile(r'(?P<group>\d+)(?P<class>\.\d+)?')

    def __new__(cls, value: str | HazardClass):
        if isinstance(value, HazardClass):
            return value
        if not HazardClass.RE.match(value):
            raise ValueError('Invalid Hazard class. Must match ') 

        return super().__new__(cls, value)

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: GetCoreSchemaHandler):
        return core_schema.no_info_after_validator_function(cls, handler(str))

    
class ResourceCostEstimate(BaseModel): 
    model_config = SCHEMA_CONFIG

    is_university_supplied: bool
    estimated_cost: float = 0

class ResourceStorage(BaseModel):
    model_config = SCHEMA_CONFIG

    description: str
    estimated_cost: ResourceCostEstimate | None = None

class ResourceDisposal(BaseModel):
    model_config = SCHEMA_CONFIG

    description: str
    estimated_cost: ResourceCostEstimate | None = None

class ResourceBase(BaseModel):
    model_config = SCHEMA_CONFIG
    __resource_type__: ClassVar[ResourceType]

    @classmethod
    def __init_subclass__(cls, **kwargs):
        if not hasattr(cls, '__resource_type__'):
            raise ValueError(f'No __resource_type__ on {cls.__name__}')
        return super().__init_subclass__(**kwargs) 

    container_id:  UUID | None = None
    index: int | Literal['create'] = 'create'

    created_at: datetime | None = None
    updated_at: datetime | None = None
