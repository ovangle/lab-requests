from pydantic.dataclasses import dataclass

from api.base.schemas import api_dataclass

from ..common.schemas import Resource, ResourceStorage, ResourceDisposal

@api_dataclass()
class OutputMaterial(Resource):
    # The base unit of consumption
    base_unit: str

    storage: ResourceStorage | None
    disposal: ResourceDisposal | None
