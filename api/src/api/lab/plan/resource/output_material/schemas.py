from pydantic.dataclasses import dataclass

from ..common.schemas import Resource, ResourceStorage, ResourceDisposal

class OutputMaterial(Resource):
    # The base unit of consumption
    base_unit: str

    storage: ResourceStorage | None
    disposal: ResourceDisposal | None
