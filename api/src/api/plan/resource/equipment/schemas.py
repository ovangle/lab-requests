from pydantic.dataclasses import dataclass

from ..common.types import ResourceType

@dataclass(kw_only=True)
class Equipment:
    type: ResourceType