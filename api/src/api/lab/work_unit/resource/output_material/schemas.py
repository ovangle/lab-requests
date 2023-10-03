from pydantic.dataclasses import dataclass

from ..common.schemas import ResourceBase, ResourceStorage, ResourceDisposal, ResourceType

class OutputMaterial(ResourceBase):
    __resource_type__ = ResourceType.OUTPUT_MATERIAL
    # The base unit of consumption
    base_unit: str

    storage: ResourceStorage | None
    disposal: ResourceDisposal | None
