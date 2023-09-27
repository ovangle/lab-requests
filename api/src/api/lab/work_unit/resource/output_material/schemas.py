from pydantic.dataclasses import dataclass

from ..common.schemas import ResourceBase, ResourceStorage, ResourceDisposal

class OutputMaterial(ResourceBase):
    # The base unit of consumption
    base_unit: str

    storage: ResourceStorage | None
    disposal: ResourceDisposal | None
