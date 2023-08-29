from pydantic.dataclasses import dataclass

from ..common.types import ResourceType

@dataclass()
class Equipment:
    type: ResourceType