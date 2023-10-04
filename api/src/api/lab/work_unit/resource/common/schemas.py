from __future__ import annotations
from abc import abstractmethod
from datetime import datetime
from enum import Enum
import re
from typing import TYPE_CHECKING, Any, ClassVar, Generic, Literal, Type, TypeVar
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, GetCoreSchemaHandler
from pydantic_core import core_schema

from api.base.schemas import SCHEMA_CONFIG
from api.lab.work_unit.resource.models import ResourceContainer
from filestore.store import StoredFile

if TYPE_CHECKING:
    from api.lab.plan.schemas import ExperimentalPlan
    from api.lab.work_unit.schemas import WorkUnit

TResource = TypeVar('TResource', bound='ResourceBase')
TResource_co = TypeVar('TResource_co', bound='ResourceBase', covariant=True)

class ResourceType(Enum):
    EQUIPMENT = 'equipment'
    SOFTWARE = 'software'
    TASK = 'task'
    INPUT_MATERIAL = 'input-material'
    OUTPUT_MATERIAL = 'output-material'

    def __new__(cls, value: Type[TResource] | TResource | ResourceType | str):
        match value:
            case type():
                return getattr(value, '__resource_type__')
            case ResourceBase():
                return getattr(type(value), '__resource_type__')
            case _:
                return super().__new__(cls, value)

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

class ResourceFileAttachment(StoredFile, BaseModel):
    model_config = SCHEMA_CONFIG

    container_id: UUID
    resource_type: ResourceType
    resource_id: UUID


class ResourceBase(BaseModel):
    model_config = SCHEMA_CONFIG
    __resource_type__: ClassVar[ResourceType]

    container_id:  UUID 
    id: UUID
    index: int 

    attachments: list[ResourceFileAttachment] = Field(default_factory=list)

    created_at: datetime 
    updated_at: datetime 

    def __init__(self: TResource, container: ResourceContainer, id: UUID, index: int, params: ResourceParams[TResource]):
        super().__init__()
        self.container_id = container.id
        self.id = id
        self.index = index
        self.created_at = self.updated_at = datetime.now()
        self.attachments = container.get_attachments(ResourceType(self), id)

    def apply(self: TResource, params: ResourceParams[TResource]):
        self.updated_at = datetime.now()

class ResourceParams(BaseModel, Generic[TResource]):
    model_config = SCHEMA_CONFIG
    __resource_type__: ClassVar[ResourceType]

